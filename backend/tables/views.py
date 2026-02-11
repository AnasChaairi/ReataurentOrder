from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from accounts.permissions import IsAdmin, IsAdminOrReadOnly, IsWaiter, IsAdminOrWaiter
from restaurants.mixins import RestaurantScopedMixin
from .models import Table, WaiterAssignment, TableSession
from .serializers import (
    TableSerializer, TableListSerializer, TableCreateUpdateSerializer,
    TableStatusSerializer, WaiterAssignmentSerializer,
    WaiterAssignmentCreateSerializer, TableSessionSerializer,
    TableSessionCreateSerializer, TableSessionEndSerializer
)


class TableViewSet(RestaurantScopedMixin, viewsets.ModelViewSet):
    queryset = Table.objects.all()
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['section', 'status', 'floor', 'is_active']
    search_fields = ['number', 'notes']
    ordering = ['section', 'number']

    def get_queryset(self):
        queryset = Table.objects.all()
        queryset = self.get_restaurant_queryset(queryset)
        if not self.request.user.is_admin:
            queryset = queryset.filter(is_active=True)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return TableListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TableCreateUpdateSerializer
        return TableSerializer

    @action(detail=True, methods=['patch'], permission_classes=[IsAdminOrWaiter])
    def update_status(self, request, pk=None):
        table = self.get_object()
        serializer = TableStatusSerializer(table, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': f'Status updated to {table.status}'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def generate_qr(self, request, pk=None):
        table = self.get_object()
        base_url = request.data.get('base_url', request.build_absolute_uri('/'))
        try:
            table.generate_qr_code(base_url)
            return Response({'message': 'QR code generated'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class WaiterAssignmentViewSet(viewsets.ModelViewSet):
    queryset = WaiterAssignment.objects.select_related('waiter', 'table')
    serializer_class = WaiterAssignmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrWaiter]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['waiter', 'table']
    ordering = ['-shift_start']

    def get_queryset(self):
        queryset = WaiterAssignment.objects.select_related('waiter', 'table')
        if self.request.user.role == 'WAITER':
            queryset = queryset.filter(waiter=self.request.user)
        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WaiterAssignmentCreateSerializer
        return WaiterAssignmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated(), IsAdminOrWaiter()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def end_shift(self, request, pk=None):
        assignment = self.get_object()
        if assignment.shift_end:
            return Response({'error': 'Already ended'}, status=status.HTTP_400_BAD_REQUEST)
        assignment.end_shift()
        return Response({'message': 'Shift ended'})

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_assignments = self.get_queryset().filter(shift_end__isnull=True)
        serializer = self.get_serializer(active_assignments, many=True)
        return Response(serializer.data)


class TableSessionViewSet(viewsets.ModelViewSet):
    queryset = TableSession.objects.select_related('table', 'customer')
    serializer_class = TableSessionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['table', 'customer']
    ordering = ['-start_time']

    def get_queryset(self):
        queryset = TableSession.objects.select_related('table', 'customer')
        if self.request.user.role == 'CUSTOMER':
            queryset = queryset.filter(customer=self.request.user)
        elif self.request.user.role == 'WAITER':
            table_ids = WaiterAssignment.objects.filter(
                waiter=self.request.user,
                shift_end__isnull=True
            ).values_list('table_id', flat=True)
            queryset = queryset.filter(table_id__in=table_ids)
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return TableSessionCreateSerializer
        return TableSessionSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrWaiter()]
        return [IsAuthenticated()]

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrWaiter])
    def end(self, request, pk=None):
        session = self.get_object()
        if session.end_time:
            return Response({'error': 'Already ended'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = TableSessionEndSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if 'rating' in serializer.validated_data:
            session.rating = serializer.validated_data['rating']
        if 'feedback' in serializer.validated_data:
            session.feedback = serializer.validated_data['feedback']

        session.end_session()
        return Response({'message': 'Session ended', 'duration_minutes': session.get_duration()})

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_sessions = self.get_queryset().filter(end_time__isnull=True)
        serializer = self.get_serializer(active_sessions, many=True)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsWaiter])
def waiter_dashboard(request):
    waiter = request.user
    active_assignments = WaiterAssignment.objects.filter(waiter=waiter, shift_end__isnull=True).select_related('table')
    assigned_tables = [a.table for a in active_assignments]
    table_ids = [t.id for t in assigned_tables]
    active_sessions = TableSession.objects.filter(table_id__in=table_ids, end_time__isnull=True)

    shift_info = {}
    if active_assignments.exists():
        first = active_assignments.first()
        shift_info = {'shift_start': first.shift_start, 'duration_minutes': (timezone.now() - first.shift_start).seconds // 60}

    return Response({
        'assigned_tables': TableListSerializer(assigned_tables, many=True).data,
        'active_sessions_count': active_sessions.count(),
        'shift_info': shift_info
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsWaiter])
def my_assigned_tables(request):
    assignments = WaiterAssignment.objects.filter(waiter=request.user, shift_end__isnull=True).select_related('table')
    tables = [a.table for a in assignments]
    return Response(TableListSerializer(tables, many=True).data)
