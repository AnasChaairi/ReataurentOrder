from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/orders/(?P<type>table)/(?P<id>\d+)/$', consumers.OrderNotificationConsumer.as_asgi()),
    re_path(r'ws/orders/(?P<type>kitchen)/$', consumers.OrderNotificationConsumer.as_asgi(), kwargs={'id': ''}),
    re_path(r'ws/orders/(?P<type>waiter)/(?P<id>\d+)/$', consumers.OrderNotificationConsumer.as_asgi()),
]
