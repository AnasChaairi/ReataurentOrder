from rest_framework import serializers
from .models import Table, WaiterAssignment, TableSession
from accounts.models import User
from accounts.serializers import UserSerializer


class TableSerializer(serializers.ModelSerializer):
    """Full serializer for Table model"""
    assigned_waiter = serializers.SerializerMethodField()
    current_session = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = [
            'id', 'number', 'capacity', 'section', 'status',
            'qr_code', 'qr_code_data', 'floor', 'is_active', 'notes',
            'assigned_waiter', 'current_session',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['qr_code', 'qr_code_data', 'created_at', 'updated_at']

    def get_assigned_waiter(self, obj):
        """Get currently assigned waiter"""
        waiter = obj.get_assigned_waiter()
        if waiter:
            return {
                'id': waiter.id,
                'name': waiter.get_full_name(),
                'email': waiter.email
            }
        return None

    def get_current_session(self, obj):
        """Get current active session"""
        session = obj.get_current_session()
        if session:
            return {
                'id': session.id,
                'customer_count': session.customer_count,
                'start_time': session.start_time,
                'duration_minutes': session.get_duration()
            }
        return None


class TableListSerializer(serializers.ModelSerializer):
    """Simplified serializer for table lists"""
    assigned_waiter_name = serializers.SerializerMethodField()
    is_occupied = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = [
            'id', 'number', 'capacity', 'section', 'status',
            'floor', 'is_active', 'assigned_waiter_name', 'is_occupied'
        ]

    def get_assigned_waiter_name(self, obj):
        """Get assigned waiter name"""
        waiter = obj.get_assigned_waiter()
        return waiter.get_full_name() if waiter else None

    def get_is_occupied(self, obj):
        """Check if table is currently occupied"""
        return obj.status == 'OCCUPIED'


class TableCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating tables"""

    class Meta:
        model = Table
        fields = [
            'number', 'capacity', 'section', 'status',
            'floor', 'is_active', 'notes'
        ]

    def validate_number(self, value):
        """Ensure table number is unique"""
        instance = self.instance
        if Table.objects.filter(number=value).exclude(
            pk=instance.pk if instance else None
        ).exists():
            raise serializers.ValidationError("Table with this number already exists.")
        return value

    def validate_capacity(self, value):
        """Ensure capacity is positive"""
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1.")
        return value


class TableStatusSerializer(serializers.ModelSerializer):
    """Serializer for updating table status"""

    class Meta:
        model = Table
        fields = ['status']

    def validate_status(self, value):
        """Validate status transitions"""
        instance = self.instance
        if instance and instance.status == 'OCCUPIED':
            # Can't change from OCCUPIED to AVAILABLE directly
            if value == 'AVAILABLE' and instance.get_current_session():
                raise serializers.ValidationError(
                    "Cannot set table to AVAILABLE while session is active. "
                    "End the session first."
                )
        return value


class WaiterAssignmentSerializer(serializers.ModelSerializer):
    """Full serializer for Waiter Assignment"""
    waiter_name = serializers.CharField(source='waiter.get_full_name', read_only=True)
    waiter_email = serializers.CharField(source='waiter.email', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.SerializerMethodField()

    class Meta:
        model = WaiterAssignment
        fields = [
            'id', 'waiter', 'waiter_name', 'waiter_email',
            'table', 'table_number',
            'shift_start', 'shift_end', 'is_active',
            'duration_minutes', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_duration_minutes(self, obj):
        """Calculate shift duration"""
        from django.utils import timezone
        if obj.shift_end:
            delta = obj.shift_end - obj.shift_start
        else:
            delta = timezone.now() - obj.shift_start
        return int(delta.total_seconds() / 60)


class WaiterAssignmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating waiter assignments"""

    class Meta:
        model = WaiterAssignment
        fields = ['waiter', 'table', 'shift_start', 'notes']

    def validate_waiter(self, value):
        """Ensure user is a waiter"""
        if value.role != 'WAITER':
            raise serializers.ValidationError("Assigned user must have WAITER role.")
        return value

    def validate(self, data):
        """Validate no overlapping assignments"""
        table = data.get('table')

        # Check if table already has active assignment
        existing = WaiterAssignment.objects.filter(
            table=table,
            shift_end__isnull=True
        )

        if existing.exists():
            raise serializers.ValidationError(
                f"Table {table.number} already has an active waiter assignment."
            )

        return data


class TableSessionSerializer(serializers.ModelSerializer):
    """Full serializer for Table Session"""
    table_number = serializers.CharField(source='table.number', read_only=True)
    customer_name = serializers.SerializerMethodField()
    is_active = serializers.BooleanField(read_only=True)
    duration_minutes = serializers.IntegerField(read_only=True, source='get_duration')
    total_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True,
        source='get_total_amount'
    )

    class Meta:
        model = TableSession
        fields = [
            'id', 'table', 'table_number', 'customer', 'customer_name',
            'customer_count', 'start_time', 'end_time', 'is_active',
            'duration_minutes', 'total_amount',
            'session_notes', 'rating', 'feedback',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def get_customer_name(self, obj):
        """Get customer name if exists"""
        if obj.customer:
            return obj.customer.get_full_name()
        return None


class TableSessionCreateSerializer(serializers.ModelSerializer):
    """Serializer for starting a table session"""

    class Meta:
        model = TableSession
        fields = ['table', 'customer', 'customer_count', 'session_notes']

    def validate_table(self, value):
        """Ensure table is available"""
        if value.status == 'OCCUPIED':
            raise serializers.ValidationError(
                "Table is currently occupied. End the current session first."
            )
        if not value.is_active:
            raise serializers.ValidationError(
                "Table is not active."
            )
        return value

    def validate_customer_count(self, value):
        """Validate customer count"""
        if value < 1:
            raise serializers.ValidationError("Customer count must be at least 1.")
        return value

    def validate(self, data):
        """Validate customer count doesn't exceed table capacity"""
        table = data.get('table')
        customer_count = data.get('customer_count')

        if customer_count > table.capacity:
            raise serializers.ValidationError(
                f"Customer count ({customer_count}) exceeds table capacity ({table.capacity})."
            )

        return data


class TableSessionEndSerializer(serializers.Serializer):
    """Serializer for ending a session with optional feedback"""
    rating = serializers.IntegerField(
        min_value=1,
        max_value=5,
        required=False,
        allow_null=True
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True
    )


class WaiterDashboardSerializer(serializers.Serializer):
    """Serializer for waiter dashboard data"""
    assigned_tables = TableListSerializer(many=True, read_only=True)
    pending_orders_count = serializers.IntegerField(read_only=True)
    active_sessions_count = serializers.IntegerField(read_only=True)
    shift_info = serializers.DictField(read_only=True)
    statistics = serializers.DictField(read_only=True)
