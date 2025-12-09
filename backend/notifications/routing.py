from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # WebSocket URLs will be added in Milestone 7
    # re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]
