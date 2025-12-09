from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db import transaction
from django.utils import timezone

from accounts.permissions import IsAdmin, IsAdminOrWaiter, IsCustomer
from .models import Order, OrderItem, OrderEvent
from .serializers import (
    OrderSerializer, OrderListSerializer, OrderCreateSerializer,
    OrderStatusUpdateSerializer, OrderModifySerializer,
    OrderEventSerializer, OrderItemSerializer
)
from .filters import OrderFilter


class OrderViewSet(viewsets.ModelViewSet):
    """ViewSet for Order management"""
    queryset = Order.objects.select_related('table', 'customer', 'waiter', 'session').prefetch_related('items')
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = OrderFilter
    search_fields = ['order_number', 'customer_notes']
    ordering_fields = ['created_at', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        """Filter orders based on user role"""
        queryset = Order.objects.select_related(
            'table', 'customer', 'waiter', 'session'
        ).prefetch_related('items__addons')

        user = self.request.user

        if user.role == 'CUSTOMER':
            # Customers see only their orders
            queryset = queryset.filter(customer=user)
        elif user.role == 'WAITER':
            # Waiters see orders for their assigned tables
            queryset = queryset.filter(waiter=user)

        return queryset

    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return OrderListSerializer
        elif self.action == 'create':
            return OrderCreateSerializer
        return OrderSerializer

    def perform_create(self, serializer):
        """Create order"""
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrWaiter])
    def verify(self, request, pk=None):
        """Verify/confirm order (Waiter/Admin only)"""
        order = self.get_object()

        if order.status != 'PENDING':
            return Response({
                'error': 'Only pending orders can be verified'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Optional waiter notes
        waiter_notes = request.data.get('waiter_notes', '')
        if waiter_notes:
            order.waiter_notes = waiter_notes

        # Update status to confirmed
        order.update_status('CONFIRMED', user=request.user)

        return Response({
            'message': 'Order verified and confirmed',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrWaiter])
    def reject(self, request, pk=None):
        """Reject order (Waiter/Admin only)"""
        order = self.get_object()

        if order.status != 'PENDING':
            return Response({
                'error': 'Only pending orders can be rejected'
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'No reason provided')
        
        order.update_status('CANCELLED', user=request.user)
        order.waiter_notes = f"Rejected: {reason}"
        order.save()

        OrderEvent.objects.create(
            order=order,
            event_type='CANCELLED',
            actor=request.user,
            description=f'Order rejected: {reason}'
        )

        return Response({
            'message': 'Order rejected',
            'reason': reason
        })

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrWaiter])
    def update_status(self, request, pk=None):
        """Update order status"""
        order = self.get_object()
        serializer = OrderStatusUpdateSerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data['status']
        notes = serializer.validated_data.get('notes', '')

        # Update status
        order.update_status(new_status, user=request.user)

        if notes:
            if request.user.role == 'WAITER':
                order.waiter_notes = notes
            else:
                order.kitchen_notes = notes
            order.save()

        return Response({
            'message': f'Order status updated to {new_status}',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['put'], permission_classes=[IsCustomer])
    def modify(self, request, pk=None):
        """Modify pending order (Customer only)"""
        order = self.get_object()

        # Ensure customer owns the order
        if order.customer != request.user:
            return Response({
                'error': 'You can only modify your own orders'
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderModifySerializer(
            data=request.data,
            context={'order': order}
        )
        serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            # Delete existing items
            order.items.all().delete()

            # Create new items
            items_data = serializer.validated_data['items']
            for item_data in items_data:
                menu_item = item_data['menu_item']
                variant = item_data.get('variant')
                addons = item_data.get('addons', [])
                quantity = item_data.get('quantity', 1)
                instructions = item_data.get('special_instructions', '')

                addons_price = sum(addon.price for addon in addons)

                order_item = OrderItem.objects.create(
                    order=order,
                    menu_item=menu_item,
                    variant=variant,
                    addons_price=addons_price,
                    quantity=quantity,
                    special_instructions=instructions
                )

                for addon in addons:
                    OrderItemAddon.objects.create(
                        order_item=order_item,
                        addon=addon
                    )

            # Recalculate totals
            order.calculate_totals()

            # Create event
            OrderEvent.objects.create(
                order=order,
                event_type='MODIFIED',
                actor=request.user,
                description='Order items modified'
            )

        return Response({
            'message': 'Order modified successfully',
            'order': OrderSerializer(order).data
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel order"""
        order = self.get_object()

        # Check permissions
        if request.user.role == 'CUSTOMER' and order.customer != request.user:
            return Response({
                'error': 'You can only cancel your own orders'
            }, status=status.HTTP_403_FORBIDDEN)

        if not order.can_cancel():
            return Response({
                'error': f'Cannot cancel order in {order.status} status'
            }, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Cancelled by user')
        
        order.update_status('CANCELLED', user=request.user)
        
        if request.user.role == 'CUSTOMER':
            order.customer_notes += f"\nCancelled: {reason}"
        else:
            order.waiter_notes += f"\nCancelled: {reason}"
        order.save()

        return Response({
            'message': 'Order cancelled successfully'
        })

    @action(detail=True, methods=['get'])
    def timeline(self, request, pk=None):
        """Get order timeline/history"""
        order = self.get_object()
        events = order.events.all()
        serializer = OrderEventSerializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Get pending orders"""
        queryset = self.get_queryset().filter(status='PENDING')
        serializer = OrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_orders(self, request):
        """Get current user's orders"""
        if request.user.role == 'CUSTOMER':
            queryset = Order.objects.filter(customer=request.user)
        elif request.user.role == 'WAITER':
            queryset = Order.objects.filter(waiter=request.user)
        else:
            queryset = self.get_queryset()

        queryset = queryset.order_by('-created_at')[:10]
        serializer = OrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsAdminOrWaiter])
    def statistics(self, request):
        """Get order statistics"""
        from django.db.models import Count, Sum

        queryset = self.get_queryset()
        
        today = timezone.now().replace(hour=0, minute=0, second=0)
        
        stats = {
            'total_orders': queryset.count(),
            'today_orders': queryset.filter(created_at__gte=today).count(),
            'pending_count': queryset.filter(status='PENDING').count(),
            'preparing_count': queryset.filter(status='PREPARING').count(),
            'ready_count': queryset.filter(status='READY').count(),
            'today_revenue': queryset.filter(
                created_at__gte=today,
                status='SERVED'
            ).aggregate(Sum('total_amount'))['total_amount__sum'] or 0
        }

        return Response(stats)


from .models import OrderItemAddon
