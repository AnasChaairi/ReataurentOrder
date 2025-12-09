from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""

    def create_user(self, email, password=None, **extra_fields):
        """Create and return a regular user with an email and password."""
        if not email:
            raise ValueError(_('The Email field must be set'))
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """Create and return a superuser with an email and password."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('role', User.Role.ADMIN)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))

        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model with role-based access."""

    class Role(models.TextChoices):
        ADMIN = 'ADMIN', _('Admin')
        WAITER = 'WAITER', _('Waiter')
        CUSTOMER = 'CUSTOMER', _('Customer')

    # Remove username, use email for authentication
    username = None
    email = models.EmailField(_('email address'), unique=True)

    # User role
    role = models.CharField(
        _('role'),
        max_length=10,
        choices=Role.choices,
        default=Role.CUSTOMER,
    )

    # Additional fields
    phone_number = PhoneNumberField(_('phone number'), blank=True, null=True)
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        verbose_name = _('user')
        verbose_name_plural = _('users')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"

    def get_full_name(self):
        """Return the user's full name."""
        full_name = f"{self.first_name} {self.last_name}".strip()
        return full_name or self.email

    @property
    def is_admin(self):
        """Check if user is an admin."""
        return self.role == self.Role.ADMIN

    @property
    def is_waiter(self):
        """Check if user is a waiter."""
        return self.role == self.Role.WAITER

    @property
    def is_customer(self):
        """Check if user is a customer."""
        return self.role == self.Role.CUSTOMER


class UserProfile(models.Model):
    """Extended user profile information."""

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_('user')
    )

    # Customer-specific fields
    preferred_language = models.CharField(_('preferred language'), max_length=10, default='en')
    dietary_preferences = models.TextField(_('dietary preferences'), blank=True)
    allergies = models.TextField(_('allergies'), blank=True)

    # Waiter-specific fields
    employee_id = models.CharField(_('employee ID'), max_length=50, blank=True, null=True, unique=True)
    shift_start = models.TimeField(_('shift start time'), blank=True, null=True)
    shift_end = models.TimeField(_('shift end time'), blank=True, null=True)

    # Metadata
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('user profile')
        verbose_name_plural = _('user profiles')

    def __str__(self):
        return f"Profile of {self.user.email}"
