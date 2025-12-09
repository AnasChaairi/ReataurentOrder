from django.contrib import admin
from .models import Table, WaiterAssignment, TableSession


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    list_display = ['number', 'capacity', 'section', 'status', 'floor', 'is_active', 'assigned_waiter_name']
    list_filter = ['section', 'status', 'floor', 'is_active']
    search_fields = ['number', 'notes']
    ordering = ['section', 'number']

    def assigned_waiter_name(self, obj):
        waiter = obj.get_assigned_waiter()
        return waiter.get_full_name() if waiter else '-'
    assigned_waiter_name.short_description = 'Assigned Waiter'


@admin.register(WaiterAssignment)
class WaiterAssignmentAdmin(admin.ModelAdmin):
    list_display = ['waiter', 'table', 'shift_start', 'shift_end', 'is_active']
    list_filter = ['shift_start', 'shift_end']
    search_fields = ['waiter__email', 'table__number']
    ordering = ['-shift_start']


@admin.register(TableSession)
class TableSessionAdmin(admin.ModelAdmin):
    list_display = ['table', 'customer', 'customer_count', 'start_time', 'end_time', 'is_active', 'rating']
    list_filter = ['start_time', 'end_time', 'rating']
    search_fields = ['table__number', 'customer__email']
    ordering = ['-start_time']
