from django.contrib import admin
from django.urls import path, include
from django.conf import settings # For serving static/media files in development
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('core.urls')),
]

# Serve media files in development (e.g., profile pictures)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Also ensure static files are served correctly in debug mode if not already
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) # Make sure STATIC_ROOT is defined or remove this if not using collectstatic for dev. It's usually STATICFILES_DIRS for dev.
