CC ?= gcc
CFLAGS ?= -O3 -std=c11 -Wall -Wextra -Iinclude
LDFLAGS ?= -lm

SRCS = src/main.c src/brush_engine.c src/renderer_gl.c src/xblend.c
OBJS = $(SRCS:.c=.o)
TARGET = vue_3d_canvas_c

ifeq ($(OS),Windows_NT)
    TARGET := $(TARGET).exe
    LDFLAGS += -lopengl32 -lgdi32 -luser32
else
    LDFLAGS += -lGL -lX11
endif

all: $(TARGET)

$(TARGET): $(OBJS)
	$(CC) $(OBJS) -o $(TARGET) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

clean:
	rm -f $(OBJS) $(TARGET) $(TARGET).exe
