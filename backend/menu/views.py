from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
import random

from accounts.permissions import IsAdmin, IsAdminOrReadOnly
from restaurants.mixins import RestaurantScopedMixin
from .models import Category, MenuItem, MenuItemVariant, MenuItemAddon, MenuItemReview
from .serializers import (
    CategorySerializer, CategoryListSerializer,
    MenuItemSerializer, MenuItemListSerializer,
    MenuItemCreateUpdateSerializer, MenuItemAvailabilitySerializer,
    MenuItemVariantSerializer, MenuItemVariantCreateSerializer,
    MenuItemAddonSerializer, MenuItemAddonCreateSerializer,
    MenuItemReviewSerializer, MenuItemReviewCreateSerializer,
    MenuItemImageSerializer
)
from .filters import MenuItemFilter
from .cache import MenuCache
from .import_export import MenuExporter, MenuImporter
from django.http import HttpResponse


def _get_device_context(request):
    """
    Returns (is_device, allowed_category_ids, restaurant_id) from the device
    token if the request is authenticated via DeviceTokenAuthentication.
    Returns (False, [], None) for regular user requests.
    """
    from devices.authentication import AnonymousDevice
    if isinstance(request.user, AnonymousDevice):
        token = request.auth
        return True, token.allowed_category_ids, token.restaurant_id
    return False, [], None


class CategoryViewSet(RestaurantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for Category CRUD operations
    - List/Retrieve: Public access (no authentication required)
    - Create/Update/Delete: Admin or Restaurant Owner only
    """
    queryset = Category.objects.all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['order', 'name', 'created_at']
    ordering = ['order', 'name']
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = Category.objects.all()

        # Filter by restaurant query param (for public/tablet access)
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        # Apply restaurant scoping for authenticated users
        queryset = self.get_restaurant_queryset(queryset)

        # Device token: scope to device's restaurant and allowed categories
        is_device, allowed_ids, device_restaurant_id = _get_device_context(self.request)
        if is_device:
            queryset = queryset.filter(
                restaurant_id=device_restaurant_id,
                is_active=True,
                restaurant__isnull=False,
            )
            if allowed_ids:
                queryset = queryset.filter(id__in=allowed_ids)
            return queryset

        # Non-admin users only see active categories with a restaurant
        if not self.request.user.is_authenticated or not getattr(self.request.user, 'is_admin', False):
            queryset = queryset.filter(is_active=True, restaurant__isnull=False)

        return queryset

    def get_object(self):
        """Override to handle slug collisions across restaurants."""
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}

        try:
            obj = queryset.get(**filter_kwargs)
        except Category.MultipleObjectsReturned:
            obj = queryset.filter(**filter_kwargs).first()
        except Category.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()

        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        """Use simplified serializer for list view"""
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer

    def list(self, request, *args, **kwargs):
        """List categories with caching. Device requests bypass cache to avoid cross-device bleed."""
        is_device, _, _ = _get_device_context(request)
        if not is_device:
            cached_data = MenuCache.get_category_list(user=request.user)
            if cached_data is not None:
                return Response(cached_data)

        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        if not is_device:
            MenuCache.set_category_list(serializer.data, user=request.user)

        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve category with caching"""
        slug = kwargs.get('slug')

        # Try to get from cache
        cached_data = MenuCache.get_category_detail(slug)
        if cached_data is not None:
            return Response(cached_data)

        # If not in cache, get from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # Cache the result
        MenuCache.set_category_detail(slug, serializer.data)

        return Response(serializer.data)


class MenuItemViewSet(RestaurantScopedMixin, viewsets.ModelViewSet):
    """
    ViewSet for MenuItem CRUD operations
    - List/Retrieve: Public access (no authentication required)
    - Create/Update/Delete: Admin or Restaurant Owner only
    - Reviews: Authenticated users can add reviews
    """
    queryset = MenuItem.objects.select_related('category').prefetch_related(
        'variants', 'available_addons'
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = MenuItemFilter
    search_fields = ['name', 'description', 'ingredients']
    ordering_fields = ['name', 'price', 'created_at', 'category__name']
    ordering = ['category__order', 'name']
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'featured', 'popular', 'recommended', 'variants', 'addons', 'reviews']:
            permission_classes = [AllowAny]
        elif self.action == 'add_review':
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        queryset = MenuItem.objects.select_related('category').prefetch_related(
            'variants', 'available_addons'
        )

        # Filter by restaurant query param (for public/tablet access)
        restaurant_id = self.request.query_params.get('restaurant')
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        # Apply restaurant scoping for authenticated users
        queryset = self.get_restaurant_queryset(queryset)

        # Device token: scope to device's restaurant and allowed categories
        is_device, allowed_ids, device_restaurant_id = _get_device_context(self.request)
        if is_device:
            queryset = queryset.filter(
                restaurant_id=device_restaurant_id,
                is_available=True,
                category__is_active=True,
                restaurant__isnull=False,
            )
            if allowed_ids:
                queryset = queryset.filter(category_id__in=allowed_ids)
            return queryset

        # Non-admin users only see available items in active categories, with a restaurant
        if not self.request.user.is_authenticated or not getattr(self.request.user, 'is_admin', False):
            queryset = queryset.filter(
                is_available=True,
                category__is_active=True,
                restaurant__isnull=False,
            )

        return queryset

    def get_object(self):
        """
        Override to handle slug collisions across restaurants.
        When the same slug exists in multiple restaurants (no restaurant filter
        in effect), return the first match instead of raising MultipleObjectsReturned.
        """
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}

        try:
            obj = queryset.get(**filter_kwargs)
        except MenuItem.MultipleObjectsReturned:
            obj = queryset.filter(**filter_kwargs).first()
        except MenuItem.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound()

        self.check_object_permissions(self.request, obj)
        return obj

    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action == 'list':
            return MenuItemListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MenuItemCreateUpdateSerializer
        elif self.action == 'toggle_availability':
            return MenuItemAvailabilitySerializer
        return MenuItemSerializer

    @action(detail=True, methods=['patch'], permission_classes=[IsAdmin])
    def toggle_availability(self, request, slug=None):
        """Toggle item availability (Admin only)"""
        menu_item = self.get_object()
        serializer = self.get_serializer(menu_item, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response({
            'message': f'Item availability updated to {menu_item.is_available}',
            'is_available': menu_item.is_available
        })

    def list(self, request, *args, **kwargs):
        """List menu items with caching"""
        # Try to get from cache
        cached_data = MenuCache.get_menu_item_list(user=request.user)
        if cached_data is not None:
            return Response(cached_data)

        # If not in cache, get from database
        queryset = self.filter_queryset(self.get_queryset())

        # Paginate if needed
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)

        # Cache the result
        MenuCache.set_menu_item_list(serializer.data, user=request.user)

        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve menu item with caching"""
        slug = kwargs.get('slug')

        # Try to get from cache
        cached_data = MenuCache.get_menu_item_detail(slug)
        if cached_data is not None:
            return Response(cached_data)

        # If not in cache, get from database
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # Cache the result
        MenuCache.set_menu_item_detail(slug, serializer.data)

        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        """Get featured menu items with caching"""
        # Try to get from cache
        cached_data = MenuCache.get_featured_items()
        if cached_data is not None:
            return Response(cached_data)

        # If not in cache, get from database
        featured_items = self.get_queryset().filter(is_featured=True)
        serializer = MenuItemListSerializer(featured_items, many=True)

        # Cache the result
        MenuCache.set_featured_items(serializer.data)

        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def variants(self, request, slug=None):
        """Get all variants for a menu item"""
        menu_item = self.get_object()
        variants = menu_item.variants.filter(is_available=True)
        serializer = MenuItemVariantSerializer(variants, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def add_variant(self, request, slug=None):
        """Add a new variant to menu item (Admin only)"""
        menu_item = self.get_object()
        serializer = MenuItemVariantCreateSerializer(
            data=request.data,
            context={'menu_item': menu_item}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(menu_item=menu_item)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def addons(self, request, slug=None):
        """Get all available add-ons for a menu item"""
        menu_item = self.get_object()
        addons = menu_item.available_addons.filter(is_available=True)
        serializer = MenuItemAddonSerializer(addons, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def reviews(self, request, slug=None):
        """Get all approved reviews for a menu item"""
        menu_item = self.get_object()
        reviews = menu_item.reviews.filter(is_approved=True).select_related('user')
        serializer = MenuItemReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, slug=None):
        """Add a review for a menu item (Authenticated users only)"""
        menu_item = self.get_object()

        # Add menu_item to request data
        data = request.data.copy()
        data['menu_item'] = menu_item.id

        serializer = MenuItemReviewCreateSerializer(
            data=data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Invalidate cache after review
        MenuCache.invalidate_menu_item_detail(slug)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['get'])
    def recommended(self, request, slug=None):
        """Get recommended menu items (simple approach: same/complementary category)"""
        menu_item = self.get_object()

        # Get items from the same category
        same_category_items = self.get_queryset().filter(
            category=menu_item.category
        ).exclude(id=menu_item.id)

        # If we have items from same category, return up to 3
        if same_category_items.exists():
            recommended_items = list(same_category_items)
            # Shuffle and take 3
            random.shuffle(recommended_items)
            recommended_items = recommended_items[:3]
        else:
            # If no items in same category, get random items
            all_items = list(self.get_queryset().exclude(id=menu_item.id))
            random.shuffle(all_items)
            recommended_items = all_items[:3]

        serializer = MenuItemListSerializer(recommended_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular menu items based on order frequency"""
        from orders.models import OrderItem

        # Get items ordered most frequently
        popular_item_ids = OrderItem.objects.values('menu_item').annotate(
            order_count=Count('id')
        ).order_by('-order_count')[:4].values_list('menu_item', flat=True)

        if popular_item_ids:
            # Get the actual menu items maintaining the order
            popular_items = []
            for item_id in popular_item_ids:
                try:
                    item = self.get_queryset().get(id=item_id)
                    popular_items.append(item)
                except MenuItem.DoesNotExist:
                    continue
        else:
            # If no order data, return featured or random items
            popular_items = list(self.get_queryset().filter(is_featured=True)[:4])
            if len(popular_items) < 4:
                remaining = list(self.get_queryset().exclude(
                    id__in=[item.id for item in popular_items]
                ))
                random.shuffle(remaining)
                popular_items.extend(remaining[:4 - len(popular_items)])

        serializer = MenuItemListSerializer(popular_items, many=True)
        return Response(serializer.data)


class MenuItemVariantViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing MenuItem Variants
    - Admin only
    """
    queryset = MenuItemVariant.objects.select_related('menu_item')
    serializer_class = MenuItemVariantSerializer
    permission_classes = [IsAuthenticated, IsAdmin]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['price_modifier', 'name']
    ordering = ['price_modifier']

    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return MenuItemVariantCreateSerializer
        return MenuItemVariantSerializer

    def get_serializer_context(self):
        """Add menu_item to context for validation"""
        context = super().get_serializer_context()
        if 'menu_item_id' in self.kwargs:
            context['menu_item_id'] = self.kwargs['menu_item_id']
        return context


class MenuItemAddonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing MenuItem Add-ons
    - List/Retrieve: Public access (no authentication required)
    - Create/Update/Delete: Admin only
    """
    queryset = MenuItemAddon.objects.prefetch_related('menu_items')
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_available']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price', 'category']
    ordering = ['category', 'name']

    def get_permissions(self):
        """
        Allow public access for read operations, admin only for write operations
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated, IsAdmin]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """Filter available add-ons for non-admin users"""
        queryset = MenuItemAddon.objects.prefetch_related('menu_items')

        if not self.request.user.is_authenticated or not getattr(self.request.user, 'is_admin', False):
            queryset = queryset.filter(is_available=True)

        return queryset

    def get_serializer_class(self):
        """Use appropriate serializer based on action"""
        if self.action in ['create', 'update', 'partial_update']:
            return MenuItemAddonCreateSerializer
        return MenuItemAddonSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def assign_to_items(self, request, pk=None):
        """Assign this add-on to multiple menu items (Admin only)"""
        addon = self.get_object()
        menu_item_ids = request.data.get('menu_item_ids', [])

        if not menu_item_ids:
            return Response(
                {'error': 'menu_item_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        menu_items = MenuItem.objects.filter(id__in=menu_item_ids)
        addon.menu_items.add(*menu_items)

        return Response({
            'message': f'Add-on assigned to {menu_items.count()} menu items',
            'assigned_count': menu_items.count()
        })

    @action(detail=True, methods=['post'], permission_classes=[IsAdmin])
    def remove_from_items(self, request, pk=None):
        """Remove this add-on from multiple menu items (Admin only)"""
        addon = self.get_object()
        menu_item_ids = request.data.get('menu_item_ids', [])

        if not menu_item_ids:
            return Response(
                {'error': 'menu_item_ids is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        menu_items = MenuItem.objects.filter(id__in=menu_item_ids)
        addon.menu_items.remove(*menu_items)

        return Response({
            'message': f'Add-on removed from {menu_items.count()} menu items',
            'removed_count': menu_items.count()
        })


# Cache Management Views (Admin only)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def warm_cache_view(request):
    """
    Warm up menu cache (Admin only)
    Endpoint: POST /api/menu/admin/cache/warm/
    """
    try:
        result = MenuCache.warm_cache()
        return Response({
            'message': 'Cache warmed successfully',
            'details': result
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Failed to warm cache',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def invalidate_cache_view(request):
    """
    Invalidate all menu cache (Admin only)
    Endpoint: POST /api/menu/admin/cache/invalidate/
    """
    try:
        MenuCache.invalidate_all()
        return Response({
            'message': 'All menu cache invalidated successfully'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': 'Failed to invalidate cache',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Import/Export Views (Admin only)
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdmin])
def import_menu_view(request):
    """
    Import menu data from CSV or JSON file (Admin only)
    Endpoint: POST /api/menu/admin/import/
    Expected: multipart/form-data with 'file' field
    """
    if 'file' not in request.FILES:
        return Response({
            'error': 'No file provided'
        }, status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES['file']
    file_extension = file.name.split('.')[-1].lower()

    try:
        if file_extension == 'csv':
            results = MenuImporter.import_from_csv(file)
        elif file_extension == 'json':
            results = MenuImporter.import_from_json(file)
        else:
            return Response({
                'error': 'Unsupported file format. Use CSV or JSON.'
            }, status=status.HTTP_400_BAD_REQUEST)

        if results['success']:
            # Invalidate cache after successful import
            MenuCache.invalidate_all()

            return Response({
                'message': 'Menu imported successfully',
                'details': results
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Import failed',
                'details': results
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': 'Import failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsAdmin])
def export_menu_view(request):
    """
    Export menu data to CSV or JSON format (Admin only)
    Endpoint: GET /api/menu/admin/export/?format=csv|json
    """
    export_format = request.query_params.get('format', 'json').lower()

    try:
        if export_format == 'csv':
            csv_data = MenuExporter.export_to_csv()
            response = HttpResponse(csv_data, content_type='text/csv')
            response['Content-Disposition'] = 'attachment; filename="menu_export.csv"'
            return response

        elif export_format == 'json':
            json_data = MenuExporter.export_to_json()
            response = HttpResponse(json_data, content_type='application/json')
            response['Content-Disposition'] = 'attachment; filename="menu_export.json"'
            return response

        else:
            return Response({
                'error': 'Unsupported format. Use csv or json.'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response({
            'error': 'Export failed',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
