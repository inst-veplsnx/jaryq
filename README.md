<div align="center">

<img src="assets/icon.png" alt="Jaryq Logo" width="120" height="120" />

# Jaryq — Аудиокітапхана

### Аудиобиблиотека для незрячих и слабовидящих пользователей

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TalkBack](https://img.shields.io/badge/Samsung-TalkBack-1428A0?logo=samsung&logoColor=white)](https://support.google.com/accessibility/android/answer/6283677)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Возможности](#-возможности) • [Скриншоты](#-скриншоты) • [Установка](#-установка) • [База данных](#-база-данных) • [TalkBack](#-поддержка-talkback)

</div>

---

## О проекте

**Jaryq** (каз. *жарық* — «свет») — мобильное приложение аудиобиблиотеки, разработанное специально для незрячих и слабовидящих пользователей. Каждый элемент интерфейса оптимизирован для работы с **Samsung TalkBack** и стандартным Android Accessibility.

Пользователи могут слушать аудиокниги, сохранять прогресс, добавлять книги в избранное и продолжать с того места, где остановились — на любом устройстве.

---

## Возможности

| Функция | Описание |
|---|---|
| **Авторизация** | Регистрация и вход по email/паролю |
| **Аудиоплеер** | Воспроизведение с регулировкой скорости (75%–200%) |
| **Автосохранение** | Прогресс сохраняется каждые 10 секунд |
| **Избранное** | Сохранение понравившихся книг |
| **Книжная полка** | Все прослушанные книги с прогрессом |
| **Поиск** | По названию, автору и диктору |
| **Жанры** | Навигация по категориям |
| **TalkBack** | Полная поддержка экранного диктора |

---


## Стек технологий

```
Frontend:   React Native 0.74 + Expo 51 + TypeScript
Backend:    Supabase (PostgreSQL + Auth + Storage)
Аудио:      expo-av (фоновое воспроизведение)
Навигация:  React Navigation 6 (Stack + Bottom Tabs)
State:      Zustand
```

### Почему Supabase?

-  **Бесплатный тариф** — 500MB БД, 1GB Storage, 50 000 пользователей/мес
-  Встроенная аутентификация с защитой Row Level Security
-  Хранилище для аудиофайлов и обложек
-  Автоматические REST и Realtime API

---

##  Поддержка TalkBack

Приложение полностью совместимо с **Samsung TalkBack** и стандартным Android TalkBack:

- Каждый элемент имеет `accessibilityLabel` и `accessibilityHint`
- Все кнопки имеют минимальный размер касания **52dp**
- Роли элементов: `button`, `header`, `switch`, `adjustable`
- Плеер зачитывается одним блоком: автор, книга, глава, время, скорость
- Смена главы сопровождается голосовым анонсом
- Слайдер перемотки управляется свайпом вверх/вниз

```typescript
// Пример паттерна доступности в проекте
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Следующая глава"
  accessibilityHint="Дважды нажмите для перехода к следующей главе"
  accessibilityState={{ disabled: isLastChapter }}
>
```

---

## Установка

### Требования

- [Node.js 18+](https://nodejs.org)
- [Expo Go](https://expo.dev/client) на Android устройстве
- Аккаунт [Supabase](https://supabase.com) (бесплатно)

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/jaryq.git
cd jaryq
npm install
```

### 2. Настройте Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. В **SQL Editor** выполните файл [`jaryq_database.sql`](./jaryq_database.sql)
3. Скопируйте ваши ключи из **Settings → API**

### 3. Настройте переменные окружения

Откройте `src/services/supabase.ts` и замените значения:

```typescript
export const SUPABASE_URL = 'https://ВАШ_ПРОЕКТ.supabase.co';
export const SUPABASE_ANON_KEY = 'ВАШ_ANON_KEY';
```

### 4. Запустите приложение

```bash
npx expo start
```

Отсканируйте QR-код приложением **Expo Go** на телефоне.

---

## База данных

### Схема таблиц

```
profiles        — пользователи (id, email, full_name)
books           — книги (title, author, narrator, description, ...)
chapters        — главы (book_id, chapter_number, audio_url, duration)
genres          — жанры (name, icon)
user_progress   — прогресс (user_id, book_id, chapter_id, position)
favorites       — избранное (user_id, book_id)
```

### Добавление аудиокниг

**Через Supabase Storage:**
1. Storage → New bucket → назовите `audio` (Public)
2. Загрузите MP3 файл
3. Скопируйте публичный URL файла

**Через Table Editor:**
```sql
-- Сначала добавьте книгу
INSERT INTO books (title, author, narrator, is_new, total_chapters, total_duration)
VALUES ('Название', 'Автор', 'Диктор', true, 10, 36000);

-- Затем главы (audio_url — прямая ссылка на MP3)
INSERT INTO chapters (book_id, chapter_number, title, audio_url, duration)
VALUES ('uuid-книги', 1, 'Глава 1', 'https://...file.mp3', 3600);
```

---

## Структура проекта

```
jaryq/
├── App.tsx                        # Точка входа
├── app.json                       # Конфигурация Expo
├── jaryq_database.sql             # SQL схема базы данных
│
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx       # Навигация (Stack + Tabs)
    ├── screens/
    │   ├── LoginScreen.tsx        # Вход
    │   ├── RegisterScreen.tsx     # Регистрация
    │   ├── HomeScreen.tsx         # Главное меню
    │   ├── ListScreens.tsx        # Новинки, Жанры, Избранное, Полка
    │   ├── SearchScreen.tsx       # Поиск
    │   ├── BookDetailScreen.tsx   # Страница книги
    │   ├── PlayerScreen.tsx       # Аудиоплеер
    │   └── ProfileScreen.tsx      # Профиль и настройки
    ├── components/
    │   ├── AccessibleButton.tsx   # Кнопка с TalkBack поддержкой
    │   └── BookListItem.tsx       # Элемент списка книг
    ├── services/
    │   ├── supabase.ts            # Supabase клиент
    │   ├── bookService.ts         # CRUD операции с книгами
    │   └── audioService.ts        # Управление воспроизведением
    ├── store/
    │   ├── authStore.ts           # Состояние авторизации (Zustand)
    │   └── playerStore.ts         # Состояние плеера (Zustand)
    ├── types/
    │   └── index.ts               # TypeScript типы
    └── utils/
        └── accessibility.ts       # Утилиты для TalkBack
```

---

## Сборка APK

```bash
# Установите EAS CLI
npm install -g eas-cli

# Войдите в аккаунт Expo
eas login

# Соберите APK
eas build --platform android --profile preview
```

Готовый APK будет доступен для скачивания через 15–20 минут.

---

## Вклад в проект

Pull requests приветствуются! Для крупных изменений сначала откройте Issue.

1. Fork репозитория
2. Создайте ветку: `git checkout -b feature/новая-функция`
3. Commit: `git commit -m 'feat: добавить новую функцию'`
4. Push: `git push origin feature/новая-функция`
5. Откройте Pull Request

---

## 📄 Лицензия

[MIT](LICENSE) © 2024 Jaryq

---

<div align="center">
  <p>Сделано с ❤️ для незрячих и слабовидящих пользователей</p>
  <p><strong>Jaryq — жарық жол, ашық кітап</strong></p>
</div>
