from rest_framework import serializers
from .models import Category, MenuItem, MenuItemVariant, MenuItemAddon, MenuItemImage, MenuItemReview, MenuItemComboChoice


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'image',
            'order', 'is_active', 'items_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def get_items_count(self, obj):
        """Return count of active items in this category"""
        return obj.items.filter(is_available=True).count()


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified serializer for category lists"""
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'image', 'order', 'items_count']

    def get_items_count(self, obj):
        return obj.items.filter(is_available=True).count()


class MenuItemVariantSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Variants"""
    final_price = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        source='get_final_price'
    )

    class Meta:
        model = MenuItemVariant
        fields = [
            'id', 'name', 'size', 'price_modifier',
            'final_price', 'is_available',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MenuItemAddonSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Add-ons"""

    class Meta:
        model = MenuItemAddon
        fields = [
            'id', 'name', 'category', 'description', 'price',
            'is_available', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MenuItemImageSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Images"""

    class Meta:
        model = MenuItemImage
        fields = [
            'id', 'image', 'alt_text', 'order', 'is_primary', 'created_at'
        ]
        read_only_fields = ['created_at']


class MenuItemReviewSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Reviews"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = MenuItemReview
        fields = [
            'id', 'menu_item', 'user', 'user_name', 'user_email',
            'rating', 'comment', 'is_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate_rating(self, value):
        """Ensure rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ComboChoiceSerializer(serializers.ModelSerializer):
    """Serializer for a single choice within a combo group"""
    choice_item_id = serializers.IntegerField(source='choice_item.id', read_only=True, allow_null=True)
    choice_item_slug = serializers.CharField(source='choice_item.slug', read_only=True, allow_null=True)
    choice_item_image = serializers.ImageField(source='choice_item.image', read_only=True, allow_null=True)

    class Meta:
        model = MenuItemComboChoice
        fields = [
            'id', 'label', 'price_extra',
            'choice_item_id', 'choice_item_slug', 'choice_item_image',
            'odoo_combo_id',
        ]


class ComboGroupSerializer(serializers.Serializer):
    """Groups combo choices by odoo_combo_id into named choice groups"""
    combo_id = serializers.IntegerField()
    choices = ComboChoiceSerializer(many=True)


class MenuItemSerializer(serializers.ModelSerializer):
    """Full serializer for MenuItem with all details"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_slug = serializers.CharField(source='category.slug', read_only=True)
    variants = MenuItemVariantSerializer(many=True, read_only=True)
    available_addons = MenuItemAddonSerializer(many=True, read_only=True)
    images = MenuItemImageSerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    combo_groups = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'category_slug',
            'name', 'slug', 'description', 'price', 'image',
            'is_vegetarian', 'is_vegan', 'is_gluten_free',
            'preparation_time', 'ingredients', 'allergens', 'calories',
            'is_available', 'is_featured', 'is_combo',
            'variants', 'available_addons', 'images', 'combo_groups',
            'average_rating', 'review_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']

    def get_average_rating(self, obj):
        return obj.get_average_rating()

    def get_review_count(self, obj):
        return obj.get_review_count()

    def get_combo_groups(self, obj):
        """
        Return combo choices grouped by odoo_combo_id so the frontend
        can render one picker section per group.
        """
        if not obj.is_combo:
            return []

        choices = obj.combo_choices.select_related('choice_item').order_by('odoo_combo_id', 'label')
        groups: dict = {}
        for choice in choices:
            gid = choice.odoo_combo_id or 0
            if gid not in groups:
                groups[gid] = []
            groups[gid].append(choice)

        result = []
        for combo_id, group_choices in groups.items():
            result.append({
                'combo_id': combo_id,
                'choices': ComboChoiceSerializer(group_choices, many=True, context=self.context).data,
            })
        return result


class MenuItemListSerializer(serializers.ModelSerializer):
    """Simplified serializer for menu item lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    has_variants = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'name', 'slug',
            'description', 'price', 'image',
            'is_vegetarian', 'is_vegan', 'is_gluten_free',
            'preparation_time', 'is_available', 'is_featured', 'is_combo',
            'has_variants', 'average_rating', 'review_count'
        ]

    def get_has_variants(self, obj):
        """Check if item has variants"""
        return obj.variants.filter(is_available=True).exists()

    def get_average_rating(self, obj):
        """Get average rating for this menu item"""
        return obj.get_average_rating()

    def get_review_count(self, obj):
        """Get review count for this menu item"""
        return obj.get_review_count()


class MenuItemCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating menu items"""

    class Meta:
        model = MenuItem
        fields = [
            'category', 'name', 'description', 'price', 'image',
            'is_vegetarian', 'is_vegan', 'is_gluten_free',
            'preparation_time', 'ingredients', 'allergens', 'calories',
            'is_available', 'is_featured'
        ]

    def validate_price(self, value):
        """Ensure price is positive"""
        if value <= 0:
            raise serializers.ValidationError("Price must be greater than 0.")
        return value


class MenuItemVariantCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating variants"""

    class Meta:
        model = MenuItemVariant
        fields = ['name', 'size', 'price_modifier', 'is_available']

    def validate(self, data):
        """Validate variant data"""
        menu_item = self.context.get('menu_item')
        name = data.get('name')

        if menu_item and name:
            # Check for duplicate variant names for this menu item
            if MenuItemVariant.objects.filter(
                menu_item=menu_item,
                name=name
            ).exclude(pk=self.instance.pk if self.instance else None).exists():
                raise serializers.ValidationError(
                    {"name": "A variant with this name already exists for this menu item."}
                )

        return data


class MenuItemAddonCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating add-ons"""
    menu_items = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=MenuItem.objects.all(),
        required=False
    )

    class Meta:
        model = MenuItemAddon
        fields = [
            'name', 'category', 'description', 'price',
            'is_available', 'menu_items'
        ]

    def validate_price(self, value):
        """Ensure price is not negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class MenuItemAvailabilitySerializer(serializers.ModelSerializer):
    """Serializer for quickly toggling availability"""

    class Meta:
        model = MenuItem
        fields = ['is_available']


class MenuItemImageSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Images"""

    class Meta:
        model = MenuItemImage
        fields = [
            'id', 'image', 'alt_text', 'order', 'is_primary', 'created_at'
        ]
        read_only_fields = ['created_at']


class MenuItemReviewSerializer(serializers.ModelSerializer):
    """Serializer for MenuItem Reviews"""
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = MenuItemReview
        fields = [
            'id', 'menu_item', 'user', 'user_name', 'user_email',
            'rating', 'comment', 'is_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

    def validate_rating(self, value):
        """Ensure rating is between 1 and 5"""
        if value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class MenuItemReviewCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating reviews"""

    class Meta:
        model = MenuItemReview
        fields = ['menu_item', 'rating', 'comment']

    def validate(self, data):
        """Check if user already reviewed this item"""
        user = self.context['request'].user
        menu_item = data.get('menu_item')

        if MenuItemReview.objects.filter(user=user, menu_item=menu_item).exists():
            raise serializers.ValidationError(
                "You have already reviewed this item. Please update your existing review."
            )

        return data

    def create(self, validated_data):
        """Automatically set the user from request"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
