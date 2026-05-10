# Подготовка обложек книг для JARYQ

Целевой размер: **300×400 px**, соотношение 3:4, формат JPG.

---

## Установка ImageMagick

```bash
sudo dnf install imagemagick
```

---

## Одна картинка

```bash
magick input.jpg -resize 300x400^ -gravity center -extent 300x400 -quality 85 -strip output.jpg
```

---

## Все картинки в папке сразу

Положи исходники в папку `covers_raw/`, затем выполни:

```bash
mkdir -p covers_ready
for f in covers_raw/*.jpg covers_raw/*.png covers_raw/*.jpeg; do
  [ -f "$f" ] || continue
  name=$(basename "${f%.*}")
  magick "$f" -resize 300x400^ -gravity center -extent 300x400 -quality 85 -strip "covers_ready/${name}.jpg"
  echo "✅ $name"
done
```

Готовые обложки появятся в `covers_ready/`.

---

## Как работает обрезка

| Флаг | Что делает |
|------|-----------|
| `-resize 300x400^` | Масштабирует так, чтобы меньшая сторона покрыла нужный размер |
| `-gravity center` | Центрирует перед обрезкой |
| `-extent 300x400` | Обрезает до точного размера |
| `-quality 85` | Оптимальное качество JPG (50–100 КБ на файл) |
| `-strip` | Убирает метаданные (GPS, камера) — уменьшает файл на 10–20% |

Картинка любого соотношения → ровно 300×400, без белых полос, без искажений.

---

## Загрузка в Cloudflare R2

1. Загрузи готовые файлы из `covers_ready/` в бакет `jaryq-audio` в папку `covers/`
2. Публичный URL будет: `https://pub-XXXXX.r2.dev/covers/название.jpg`

---

## Добавление обложки в базу данных

При вставке книги:

```sql
INSERT INTO books (title, author, cover_url, ...)
VALUES ('Название', 'Автор', 'https://pub-XXXXX.r2.dev/covers/название.jpg', ...);
```

Для уже существующей книги:

```sql
UPDATE books
SET cover_url = 'https://pub-XXXXX.r2.dev/covers/название.jpg'
WHERE id = 'UUID_книги';
```
