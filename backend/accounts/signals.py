from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from .models import UserProfile

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create UserProfile when a new User is created."""
    if created:
        UserProfile.objects.get_or_create(user=instance)


# NOTE: The previous save_user_profile signal unconditionally called
# instance.profile.save() on every User save — including every login
# (UPDATE_LAST_LOGIN=True causes a User save on each token issue).
# This added a redundant DB write per authentication event.
#
# Profile fields are persisted explicitly in:
#   - UserProfileUpdateSerializer.update()  (user-initiated profile edits)
#   - AdminUserUpdateSerializer             (admin edits)
#
# Do NOT add a blanket post_save signal here.
