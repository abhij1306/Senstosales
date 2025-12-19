import sqlite3

conn = sqlite3.connect('backend/database/business.db')
cursor = conn.cursor()

# Check indexes
cursor.execute("SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name")
indexes = cursor.fetchall()
print(f'\n✓ Total indexes created: {len(indexes)}')
for idx in indexes:
    print(f'  - {idx[0]}')

# Check triggers
cursor.execute("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'check_%' ORDER BY name")
triggers = cursor.fetchall()
print(f'\n✓ Total constraint triggers created: {len(triggers)}')
for trigger in triggers:
    print(f'  - {trigger[0]}')

conn.close()
print('\n✓ Database migration verification complete\n')
