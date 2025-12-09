# Database Migration Instructions

## Important: Run Migrations After Backend Updates

New models have been added to the backend that require database migrations:

### New Models Added:
1. **MenuItemImage** - For multiple images per menu item (gallery support)
2. **MenuItemReview** - For customer ratings and reviews

### To Run Migrations:

#### Using Docker:
```bash
cd /path/to/ReataurentOrder
docker-compose exec web python manage.py makemigrations menu
docker-compose exec web python manage.py migrate
```

#### Using Local Django (with virtualenv):
```bash
cd /path/to/ReataurentOrder/backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python manage.py makemigrations menu
python manage.py migrate
```

### Verify Migrations:
```bash
# Check migration status
python manage.py showmigrations menu

# Should show new migrations for MenuItemImage and MenuItemReview
```

### Admin Access:
After migrations, the new models will be available in Django admin at:
- `/admin/menu/menuitemimage/`
- `/admin/menu/menuitemreview/`

### API Endpoints Added:
- `GET /api/menu/items/{slug}/reviews/` - List reviews
- `POST /api/menu/items/{slug}/add_review/` - Add review
- `GET /api/menu/items/{slug}/recommended/` - Get recommended items
- `GET /api/menu/items/popular/` - Get popular items

## Next Steps After Migration:

1. Run the migrations as shown above
2. Test the new endpoints using Postman or the frontend
3. Add some sample reviews and images via Django admin
4. Verify the menu detail modal displays images and ratings correctly
