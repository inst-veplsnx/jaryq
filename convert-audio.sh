#!/bin/bash

# ============================================================
# 🎵 JARYQ Audio Converter — MP3 → AAC (M4A)
# 
# Конвертирует MP3 файлы в AAC формат для экономии места (50-60%)
# Требуется: ffmpeg
#
# Использование:
#   ./convert-audio.sh file.mp3              # Один файл
#   ./convert-audio.sh *.mp3                 # Несколько файлов
#   ./convert-audio.sh ./audiobooks/*.mp3    # Все MP3 в папке
#   ./convert-audio.sh -b 96 file.mp3        # С битрейтом 96kbps
#   ./convert-audio.sh -b 64 -r 22050 *.mp3  # С битрейтом и частотой
#
# Опции:
#   -b <bitrate>  Битрейт в kbps (по умолчанию: 64)
#   -r <rate>     Частота дискретизации (по умолчанию: 22050)
#   -o <dir>      Выходная директория (по умолчанию: ./converted)
#   -q            Тихий режим (без вывода ffmpeg)
#   -h            Помощь
# ============================================================

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Параметры по умолчанию
BITRATE=64
SAMPLE_RATE=22050
OUTPUT_DIR="./converted"
QUIET=false
FILES=()

# Функция помощи
show_help() {
    echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${GREEN}🎵 JARYQ Audio Converter — MP3 → AAC${NC}                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}Использование:${NC}                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    ./convert-audio.sh file.mp3                      ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    ./convert-audio.sh *.mp3                         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    ./convert-audio.sh -b 96 file.mp3                ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}                                                    ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${YELLOW}Опции:${NC}                                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    -b <bitrate>  Битрейт kbps (по умолч.: 64)       ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    -r <rate>     Частота (по умолч.: 22050)         ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    -o <dir>      Выходная папка (по умолч.: ./conv) ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    -q            Тихий режим                        ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}    -h            Помощь                             ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
}

# Парсинг аргументов
while [[ $# -gt 0 ]]; do
    case $1 in
        -b)
            BITRATE="$2"
            shift 2
            ;;
        -r)
            SAMPLE_RATE="$2"
            shift 2
            ;;
        -o)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        -q)
            QUIET=true
            shift
            ;;
        -h|--help)
            show_help
            ;;
        *)
            FILES+=("$1")
            shift
            ;;
    esac
done

# Проверка наличия файлов
if [ ${#FILES[@]} -eq 0 ]; then
    echo -e "${RED}❌ Ошибка: Не указаны файлы для конвертации${NC}"
    echo -e "${YELLOW}💡 Используйте -h для справки${NC}"
    exit 1
fi

# Проверка наличия ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}❌ Ошибка: ffmpeg не установлен${NC}"
    echo ""
    echo -e "${YELLOW}Установите ffmpeg:${NC}"
    echo -e "  ${CYAN}Ubuntu/Debian:${NC}  sudo apt install ffmpeg"
    echo -e "  ${CYAN}macOS:${NC}         brew install ffmpeg"
    echo -e "  ${CYAN}Windows:${NC}       choco install ffmpeg"
    echo ""
    exit 1
fi

# Версия ffmpeg
FFMPEG_VERSION=$(ffmpeg -version | head -n 1)
echo -e "${GREEN}✅ ffmpeg найден:${NC} ${FFMPEG_VERSION}"

# Создание выходной директории
mkdir -p "$OUTPUT_DIR"

echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}🎵 JARYQ Audio Converter${NC}                            ${CYAN}║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ${YELLOW}Параметры конвертации:${NC}                              ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}    Битрейт:        ${BITRATE} kbps                          ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}    Частота:        ${SAMPLE_RATE} Hz                         ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}    Выходная папка: ${OUTPUT_DIR}           ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}    Файлов:         ${#FILES[@]}                              ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Счётчики
SUCCESS=0
FAILED=0
TOTAL_SIZE_BEFORE=0
TOTAL_SIZE_AFTER=0

# Функция конвертации
convert_file() {
    local input_file="$1"
    local filename=$(basename -- "$input_file")
    local extension="${filename##*.}"
    local name="${filename%.*}"
    local output_file="${OUTPUT_DIR}/${name}.m4a"

    echo -e "${BLUE}🔄 Конвертация:${NC} ${filename}"

    # Проверка существования входного файла
    if [ ! -f "$input_file" ]; then
        echo -e "  ${RED}❌ Файл не найден${NC}"
        FAILED=$((FAILED + 1))
        return
    fi

    # Получить размер входного файла
    local input_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    TOTAL_SIZE_BEFORE=$((TOTAL_SIZE_BEFORE + input_size))

    # Проверка, существует ли уже выходной файл
    if [ -f "$output_file" ]; then
        echo -e "  ${YELLOW}⚠️  Файл уже существует, пропускаем${NC}"
        SUCCESS=$((SUCCESS + 1))
        return
    fi

    # Конвертация
    if [ "$QUIET" = true ]; then
        ffmpeg -i "$input_file" \
            -c:a aac \
            -b:a "${BITRATE}k" \
            -ar "$SAMPLE_RATE" \
            -ac 1 \
            -y \
            "$output_file" 2>/dev/null
    else
        ffmpeg -i "$input_file" \
            -c:a aac \
            -b:a "${BITRATE}k" \
            -ar "$SAMPLE_RATE" \
            -ac 1 \
            -y \
            "$output_file"
    fi

    # Проверка результата
    if [ $? -eq 0 ] && [ -f "$output_file" ]; then
        local output_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
        TOTAL_SIZE_AFTER=$((TOTAL_SIZE_AFTER + output_size))

        # Расчёт сжатия
        local savings=0
        if [ $input_size -gt 0 ]; then
            savings=$(( (input_size - output_size) * 100 / input_size ))
        fi

        echo -e "  ${GREEN}✅ Успех!${NC} (${input_size} bytes → ${output_size} bytes, сжатие: ${savings}%)"
        SUCCESS=$((SUCCESS + 1))
    else
        echo -e "  ${RED}❌ Ошибка конвертации${NC}"
        FAILED=$((FAILED + 1))
    fi

    echo ""
}

# Конвертация каждого файла
for file in "${FILES[@]}"; do
    convert_file "$file"
done

# Итоговая статистика
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║${NC}  ${GREEN}📊 Итоговая статистика${NC}                                ${CYAN}║${NC}"
echo -e "${CYAN}╠════════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║${NC}  ✅ Успешно:      ${SUCCESS} файлов                           ${CYAN}║${NC}"

if [ $FAILED -gt 0 ]; then
    echo -e "${CYAN}║${NC}  ${RED}❌ Ошибки:${NC}        ${FAILED} файлов                           ${CYAN}║${NC}"
fi

echo -e "${CYAN}║${NC}                                                        ${CYAN}║${NC}"

# Конвертация размеров в читаемый формат
function human_size() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes} B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(( bytes / 1024 )) KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$(( bytes / 1048576 )) MB"
    else
        echo "$(( bytes / 1073741824 )) GB"
    fi
}

local_size_before=$(human_size $TOTAL_SIZE_BEFORE)
local_size_after=$(human_size $TOTAL_SIZE_AFTER)

if [ $TOTAL_SIZE_BEFORE -gt 0 ]; then
    total_savings=$(( (TOTAL_SIZE_BEFORE - TOTAL_SIZE_AFTER) * 100 / TOTAL_SIZE_BEFORE ))
else
    total_savings=0
fi

echo -e "${CYAN}║${NC}  📦 Размер до:    ${local_size_before}                      ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  📦 Размер после: ${local_size_after}                       ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  💾 Сжатие:       ${total_savings}%                               ${CYAN}║${NC}"
echo -e "${CYAN}║${NC}  📁 Выходная папка: ${OUTPUT_DIR}            ${CYAN}║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

# Рекомендации
if [ $SUCCESS -gt 0 ]; then
    echo -e "${GREEN}🎉 Конвертация завершена!${NC}"
    echo ""
    echo -e "${YELLOW}📤 Следующие шаги:${NC}"
    echo -e "  1. Загрузите .m4a файлы в Cloudflare R2"
    echo -e "  2. Скопируйте публичные URL"
    echo -e "  3. Добавьте в базу данных Supabase (см. CLOUDFLARE_R2_INSTRUCTION.md)"
    echo ""
fi

# Код выхода
if [ $FAILED -gt 0 ]; then
    exit 1
fi

exit 0
