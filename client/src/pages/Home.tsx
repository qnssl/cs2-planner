import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, RefreshCw, Zap, Grid3x3, Info, Dices } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

const GRID_SIZE = 120;
const CELL_SIZE = 4; // pixels per cell

interface RoadSegment {
  type: "Ш" | "А" | "К" | "М";
  points: [number, number][];
}

type CityType = "perfect" | "compact" | "sprawl" | "industrial" | "grid" | "organic";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inputValue, setInputValue] = useState("");
  const [roads, setRoads] = useState<RoadSegment[]>([]);
  const [error, setError] = useState("");
  const [lastGeneratedType, setLastGeneratedType] = useState<CityType | null>(null);

  const roadColors = {
    Ш: "#EF4444", // Красный - Шоссе
    А: "#F97316", // Оранжевый - Артерия
    К: "#EAB308", // Желтый - Коллектор
    М: "#22C55E", // Зеленый - Местная
  };

  // Парсинг строки координат
  const parseCoordinates = (input: string): RoadSegment[] => {
    const segments: RoadSegment[] = [];
    setError("");

    try {
      const roadTypes = input.match(/[ШАКМ]:\s*[^ШАКМ]*/g) || [];

      roadTypes.forEach((roadBlock) => {
        const [typeStr, coordsStr] = roadBlock.split(":");
        const type = typeStr.trim() as "Ш" | "А" | "К" | "М";

        if (!coordsStr) return;

        const coordPairs = coordsStr.trim().split(/\s+/);

        coordPairs.forEach((pair) => {
          if (!pair) return;

          if (pair.includes("-")) {
            const [start, end] = pair.split("-");
            const [x1, y1] = start.split(",").map(Number);
            const [x2, y2] = end.split(",").map(Number);

            if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
              throw new Error(`Неверный формат координат: ${pair}`);
            }

            const points: [number, number][] = [];
            if (x1 === x2) {
              const minY = Math.min(y1, y2);
              const maxY = Math.max(y1, y2);
              for (let y = minY; y <= maxY; y++) {
                points.push([x1, y]);
              }
            } else if (y1 === y2) {
              const minX = Math.min(x1, x2);
              const maxX = Math.max(x1, x2);
              for (let x = minX; x <= maxX; x++) {
                points.push([x, y1]);
              }
            }

            if (points.length > 0) {
              segments.push({ type, points });
            }
          } else {
            const [x, y] = pair.split(",").map(Number);
            if (isNaN(x) || isNaN(y)) {
              throw new Error(`Неверный формат координат: ${pair}`);
            }
            segments.push({ type, points: [[x, y]] });
          }
        });
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка парсинга");
      return [];
    }

    return segments;
  };

  // Рисование сетки
  const drawGrid = (ctx: CanvasRenderingContext2D, roadSegments: RoadSegment[]) => {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      const pos = i * CELL_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }

    roadSegments.forEach((segment) => {
      ctx.strokeStyle = roadColors[segment.type];
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (segment.points.length === 1) {
        const [x, y] = segment.points[0];
        ctx.fillStyle = roadColors[segment.type];
        ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      } else {
        ctx.beginPath();
        segment.points.forEach((point, idx) => {
          const [x, y] = point;
          const px = x * CELL_SIZE + CELL_SIZE / 2;
          const py = y * CELL_SIZE + CELL_SIZE / 2;
          if (idx === 0) {
            ctx.moveTo(px, py);
          } else {
            ctx.lineTo(px, py);
          }
        });
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        drawGrid(ctx, roads);
      }
    }
  }, [roads]);

  const handleParse = () => {
    if (!inputValue.trim()) {
      setError("Введите координаты");
      return;
    }
    const parsed = parseCoordinates(inputValue);
    setRoads(parsed);
    setLastGeneratedType(null);
    if (parsed.length > 0) {
      toast.success(`Загружено ${parsed.length} дорожных сегментов`);
    }
  };

  // Генератор: Идеальный город (классический)
  const generatePerfectCity = () => {
    const segments: RoadSegment[] = [];

    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 60] as [number, number]),
    });
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [60, 10 + i] as [number, number]),
    });

    segments.push({
      type: "А",
      points: Array.from({ length: 61 }, (_, i) => [30, 30 + i] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 61 }, (_, i) => [90, 30 + i] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 61 }, (_, i) => [30 + i, 30] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 61 }, (_, i) => [30 + i, 90] as [number, number]),
    });

    const collectors = [
      [20, 20, 20, 40],
      [20, 80, 20, 100],
      [40, 20, 40, 40],
      [40, 80, 40, 100],
      [80, 20, 80, 40],
      [80, 80, 80, 100],
      [100, 20, 100, 40],
      [100, 80, 100, 100],
      [20, 20, 40, 20],
      [80, 20, 100, 20],
      [20, 40, 40, 40],
      [80, 40, 100, 40],
      [20, 80, 40, 80],
      [80, 80, 100, 80],
      [20, 100, 40, 100],
      [80, 100, 100, 100],
    ];

    collectors.forEach(([x1, y1, x2, y2]) => {
      const points: [number, number][] = [];
      if (x1 === x2) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y++) {
          points.push([x1, y]);
        }
      } else {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX; x <= maxX; x++) {
          points.push([x, y1]);
        }
      }
      segments.push({ type: "К", points });
    });

    const locals = [
      [15, 25, 15, 35],
      [25, 15, 25, 25],
      [25, 35, 25, 45],
      [35, 15, 35, 25],
      [35, 35, 35, 45],
      [15, 85, 15, 95],
      [25, 75, 25, 85],
      [25, 95, 25, 105],
      [35, 75, 35, 85],
      [35, 95, 35, 105],
      [75, 25, 75, 35],
      [85, 15, 85, 25],
      [85, 35, 85, 45],
      [95, 15, 95, 25],
      [95, 35, 95, 45],
      [75, 85, 75, 95],
      [85, 75, 85, 85],
      [85, 95, 85, 105],
      [95, 75, 95, 85],
      [95, 95, 95, 105],
      [15, 25, 25, 25],
      [75, 25, 85, 25],
      [15, 35, 25, 35],
      [75, 35, 85, 35],
      [15, 85, 25, 85],
      [75, 85, 85, 85],
      [15, 95, 25, 95],
      [75, 95, 85, 95],
    ];

    locals.forEach(([x1, y1, x2, y2]) => {
      const points: [number, number][] = [];
      if (x1 === x2) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        for (let y = minY; y <= maxY; y++) {
          points.push([x1, y]);
        }
      } else {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        for (let x = minX; x <= maxX; x++) {
          points.push([x, y1]);
        }
      }
      segments.push({ type: "М", points });
    });

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("perfect");
    toast.success("Идеальный город сгенерирован!");
  };

  // Генератор: Компактный город
  const generateCompactCity = () => {
    const segments: RoadSegment[] = [];

    // Шоссе - одна магистраль
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 60] as [number, number]),
    });

    // Артерии - две параллельные
    segments.push({
      type: "А",
      points: Array.from({ length: 81 }, (_, i) => [20, 20 + i] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 81 }, (_, i) => [100, 20 + i] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 81 }, (_, i) => [20 + i, 20] as [number, number]),
    });
    segments.push({
      type: "А",
      points: Array.from({ length: 81 }, (_, i) => [20 + i, 100] as [number, number]),
    });

    // Коллекторы - плотная сетка
    for (let i = 30; i < 100; i += 15) {
      segments.push({
        type: "К",
        points: Array.from({ length: 81 }, (_, j) => [i, 20 + j] as [number, number]),
      });
      segments.push({
        type: "К",
        points: Array.from({ length: 81 }, (_, j) => [20 + j, i] as [number, number]),
      });
    }

    // Местные дороги - между коллекторами
    for (let i = 25; i < 100; i += 15) {
      for (let j = 25; j < 100; j += 15) {
        segments.push({
          type: "М",
          points: Array.from({ length: 8 }, (_, k) => [i, j + k] as [number, number]),
        });
        segments.push({
          type: "М",
          points: Array.from({ length: 8 }, (_, k) => [i + k, j] as [number, number]),
        });
      }
    }

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("compact");
    toast.success("Компактный город сгенерирован!");
  };

  // Генератор: Разреженный город
  const generateSprawlCity = () => {
    const segments: RoadSegment[] = [];

    // Шоссе - две магистрали
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 60] as [number, number]),
    });
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [60, 10 + i] as [number, number]),
    });

    // Артерии - разреженные
    for (let i = 20; i < 110; i += 30) {
      segments.push({
        type: "А",
        points: Array.from({ length: 101 }, (_, j) => [i, 10 + j] as [number, number]),
      });
      segments.push({
        type: "А",
        points: Array.from({ length: 101 }, (_, j) => [10 + j, i] as [number, number]),
      });
    }

    // Коллекторы - редкие
    for (let i = 25; i < 100; i += 35) {
      for (let j = 25; j < 100; j += 35) {
        segments.push({
          type: "К",
          points: Array.from({ length: 20 }, (_, k) => [i, j + k] as [number, number]),
        });
        segments.push({
          type: "К",
          points: Array.from({ length: 20 }, (_, k) => [i + k, j] as [number, number]),
        });
      }
    }

    // Местные дороги - очень редкие
    for (let i = 30; i < 100; i += 35) {
      for (let j = 30; j < 100; j += 35) {
        segments.push({
          type: "М",
          points: Array.from({ length: 10 }, (_, k) => [i, j + k] as [number, number]),
        });
      }
    }

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("sprawl");
    toast.success("Разреженный город сгенерирован!");
  };

  // Генератор: Промышленный город
  const generateIndustrialCity = () => {
    const segments: RoadSegment[] = [];

    // Шоссе - две магистрали (промышленные коридоры)
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 30] as [number, number]),
    });
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 90] as [number, number]),
    });

    // Артерии - вертикальные для грузовиков
    for (let i = 20; i < 110; i += 25) {
      segments.push({
        type: "А",
        points: Array.from({ length: 61 }, (_, j) => [i, 30 + j] as [number, number]),
      });
    }

    // Коллекторы - внутри промышленных зон
    for (let i = 20; i < 110; i += 25) {
      segments.push({
        type: "К",
        points: Array.from({ length: 15 }, (_, k) => [i, 35 + k] as [number, number]),
      });
      segments.push({
        type: "К",
        points: Array.from({ length: 15 }, (_, k) => [i, 75 + k] as [number, number]),
      });
    }

    // Местные дороги - минимум
    for (let i = 25; i < 100; i += 30) {
      segments.push({
        type: "М",
        points: Array.from({ length: 8 }, (_, k) => [i, 40 + k] as [number, number]),
      });
      segments.push({
        type: "М",
        points: Array.from({ length: 8 }, (_, k) => [i, 80 + k] as [number, number]),
      });
    }

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("industrial");
    toast.success("Промышленный город сгенерирован!");
  };

  // Генератор: Сетка (Grid)
  const generateGridCity = () => {
    const segments: RoadSegment[] = [];

    // Шоссе - две магистрали
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [10 + i, 60] as [number, number]),
    });
    segments.push({
      type: "Ш",
      points: Array.from({ length: 101 }, (_, i) => [60, 10 + i] as [number, number]),
    });

    // Артерии - правильная сетка
    for (let i = 25; i < 100; i += 25) {
      segments.push({
        type: "А",
        points: Array.from({ length: 76 }, (_, j) => [i, 15 + j] as [number, number]),
      });
      segments.push({
        type: "А",
        points: Array.from({ length: 76 }, (_, j) => [15 + j, i] as [number, number]),
      });
    }

    // Коллекторы - между артериями
    for (let i = 20; i < 100; i += 25) {
      for (let j = 20; j < 100; j += 25) {
        segments.push({
          type: "К",
          points: Array.from({ length: 12 }, (_, k) => [i, j + k] as [number, number]),
        });
        segments.push({
          type: "К",
          points: Array.from({ length: 12 }, (_, k) => [i + k, j] as [number, number]),
        });
      }
    }

    // Местные дороги - в каждом блоке
    for (let i = 22; i < 100; i += 25) {
      for (let j = 22; j < 100; j += 25) {
        segments.push({
          type: "М",
          points: Array.from({ length: 6 }, (_, k) => [i, j + k] as [number, number]),
        });
        segments.push({
          type: "М",
          points: Array.from({ length: 6 }, (_, k) => [i + k, j] as [number, number]),
        });
      }
    }

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("grid");
    toast.success("Город-сетка сгенерирован!");
  };

  // Генератор: Органичный город
  const generateOrganicCity = () => {
    const segments: RoadSegment[] = [];

    // Шоссе - одна диагональная
    segments.push({
      type: "Ш",
      points: Array.from({ length: 81 }, (_, i) => [20 + i, 20 + i] as [number, number]),
    });

    // Артерии - радиальные от центра
    const center = 60;
    for (let angle = 0; angle < 360; angle += 45) {
      const rad = (angle * Math.PI) / 180;
      const x = Math.round(center + Math.cos(rad) * 40);
      const y = Math.round(center + Math.sin(rad) * 40);
      segments.push({
        type: "А",
        points: Array.from({ length: 41 }, (_, i) => [
          Math.round(center + (Math.cos(rad) * i * 40) / 40),
          Math.round(center + (Math.sin(rad) * i * 40) / 40),
        ] as [number, number]),
      });
    }

    // Коллекторы - концентрические круги
    for (let radius = 20; radius < 50; radius += 15) {
      for (let angle = 0; angle < 360; angle += 30) {
        const rad = (angle * Math.PI) / 180;
        const x = Math.round(center + Math.cos(rad) * radius);
        const y = Math.round(center + Math.sin(rad) * radius);
        segments.push({
          type: "К",
          points: [[x, y]],
        });
      }
    }

    // Местные дороги - случайные связи
    for (let i = 0; i < 20; i++) {
      const x = Math.floor(Math.random() * 80) + 20;
      const y = Math.floor(Math.random() * 80) + 20;
      segments.push({
        type: "М",
        points: Array.from({ length: 8 }, (_, k) => [x, y + k] as [number, number]),
      });
    }

    setRoads(segments);
    setInputValue("");
    setLastGeneratedType("organic");
    toast.success("Органичный город сгенерирован!");
  };

  const copyToClipboard = () => {
    let output = "";
    const grouped: Record<string, string[]> = { Ш: [], А: [], К: [], М: [] };

    roads.forEach((segment) => {
      segment.points.forEach((point, idx) => {
        if (idx === 0 && segment.points.length === 1) {
          grouped[segment.type].push(`${point[0]},${point[1]}`);
        } else if (idx === 0) {
          const lastPoint = segment.points[segment.points.length - 1];
          grouped[segment.type].push(
            `${point[0]},${point[1]}-${lastPoint[0]},${lastPoint[1]}`
          );
        }
      });
    });

    Object.entries(grouped).forEach(([type, coords]) => {
      if (coords.length > 0) {
        output += `${type}: ${coords.join(" ")} `;
      }
    });

    navigator.clipboard.writeText(output.trim());
    toast.success("Координаты скопированы в буфер обмена!");
  };

  const handleClear = () => {
    setRoads([]);
    setInputValue("");
    setError("");
    setLastGeneratedType(null);
    toast.success("Карта очищена");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-foreground">
      <div className="container mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Grid3x3 size={40} className="text-blue-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
              Cities: Skylines 2 Planner
            </h1>
          </div>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Спроектируйте идеальный город, соблюдая правила дорожной иерархии. Используйте генератор или вводите координаты вручную.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Управление */}
          <div className="lg:col-span-1 space-y-6">
            {/* Управление */}
            <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap size={20} className="text-yellow-400" />
                Управление
              </h2>

              {/* Ввод координат */}
              <div className="space-y-3 mb-6">
                <label className="block text-sm font-medium text-slate-300">
                  Введите координаты
                </label>
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ш: 10,60-110,60 А: 30,30-30,90 К: 20,20-20,40 М: 15,25-15,35"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 text-xs h-24 focus-visible:ring-blue-400"
                />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <Button
                  onClick={handleParse}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Загрузить
                </Button>
              </div>

              {/* Генераторы */}
              <div className="space-y-2 mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  <Dices size={16} className="inline mr-2" />
                  Генератор городов
                </label>
                <Button
                  onClick={generatePerfectCity}
                  variant={lastGeneratedType === "perfect" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Идеальный
                </Button>
                <Button
                  onClick={generateCompactCity}
                  variant={lastGeneratedType === "compact" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Компактный
                </Button>
                <Button
                  onClick={generateSprawlCity}
                  variant={lastGeneratedType === "sprawl" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Разреженный
                </Button>
                <Button
                  onClick={generateIndustrialCity}
                  variant={lastGeneratedType === "industrial" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Промышленный
                </Button>
                <Button
                  onClick={generateGridCity}
                  variant={lastGeneratedType === "grid" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Сетка
                </Button>
                <Button
                  onClick={generateOrganicCity}
                  variant={lastGeneratedType === "organic" ? "default" : "outline"}
                  className="w-full text-sm"
                >
                  Органичный
                </Button>
              </div>

              {roads.length > 0 && (
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 font-medium"
                >
                  <RefreshCw size={18} />
                  Очистить
                </Button>
              )}
            </Card>

            {/* Копирование */}
            {roads.length > 0 && (
              <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm">
                <h3 className="text-sm font-semibold text-white mb-3">Экспорт</h3>
                <Button
                  onClick={copyToClipboard}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium flex items-center justify-center gap-2"
                >
                  <Copy size={18} />
                  Копировать координаты
                </Button>
              </Card>
            )}

            {/* Легенда */}
            <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Info size={18} />
                Легенда
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: roadColors.Ш }}
                  ></div>
                  <div>
                    <p className="text-white text-sm font-medium">Шоссе (Ш)</p>
                    <p className="text-slate-400 text-xs">500м между развязками</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: roadColors.А }}
                  ></div>
                  <div>
                    <p className="text-white text-sm font-medium">Артерия (А)</p>
                    <p className="text-slate-400 text-xs">250м между перекрестками</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: roadColors.К }}
                  ></div>
                  <div>
                    <p className="text-white text-sm font-medium">Коллектор (К)</p>
                    <p className="text-slate-400 text-xs">100м между перекрестками</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: roadColors.М }}
                  ></div>
                  <div>
                    <p className="text-white text-sm font-medium">Местная (М)</p>
                    <p className="text-slate-400 text-xs">Жилые кварталы</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Информация */}
            <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm">
              <h3 className="text-sm font-semibold text-white mb-3">Статистика</h3>
              <div className="text-sm text-slate-400 space-y-2">
                <div className="flex justify-between">
                  <span>Размер поля:</span>
                  <span className="text-white font-medium">{GRID_SIZE}×{GRID_SIZE}</span>
                </div>
                <div className="flex justify-between">
                  <span>Сегментов:</span>
                  <span className="text-white font-medium">{roads.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Шоссе:</span>
                  <span className="text-red-400 font-medium">
                    {roads.filter((r) => r.type === "Ш").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Артерии:</span>
                  <span className="text-orange-400 font-medium">
                    {roads.filter((r) => r.type === "А").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Коллекторы:</span>
                  <span className="text-yellow-400 font-medium">
                    {roads.filter((r) => r.type === "К").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Местные:</span>
                  <span className="text-green-400 font-medium">
                    {roads.filter((r) => r.type === "М").length}
                  </span>
                </div>
              </div>
            </Card>
          </div>

          {/* Правая колонка - Холст */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-4">Карта города</h2>
              <div className="flex justify-center bg-slate-950 rounded-lg p-4">
                <canvas
                  ref={canvasRef}
                  width={GRID_SIZE * CELL_SIZE}
                  height={GRID_SIZE * CELL_SIZE}
                  className="border-2 border-slate-700 rounded-lg shadow-lg"
                />
              </div>
              <p className="text-xs text-slate-500 mt-4 text-center">
                Каждая клетка = 1 квадрат. Используйте эту карту как справку при строительстве в игре.
              </p>
            </Card>
          </div>
        </div>

        {/* Подсказки */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm hover:border-slate-600 transition">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🎯</span> Выберите тип города
            </h4>
            <p className="text-slate-400 text-sm">
              Каждый генератор создает уникальную структуру, но соблюдает правила иерархии дорог.
            </p>
          </Card>
          <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm hover:border-slate-600 transition">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">🛣️</span> Соблюдайте иерархию
            </h4>
            <p className="text-slate-400 text-sm">
              Дороги соединяются по порядку: Шоссе → Артерии → Коллекторы → Местные.
            </p>
          </Card>
          <Card className="bg-card border-slate-700 p-6 backdrop-blur-sm hover:border-slate-600 transition">
            <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
              <span className="text-2xl">📋</span> Копируйте и используйте
            </h4>
            <p className="text-slate-400 text-sm">
              Скопируйте координаты и вставьте их на сайт игры для автоматического построения.
            </p>
          </Card>
        </div>

        {/* Подвал */}
        <div className="mt-12 text-center text-slate-500 text-sm border-t border-slate-800 pt-8">
          <p>
            Cities: Skylines 2 Planner — инструмент для планирования городов, соблюдающий правила дорожной иерархии.
          </p>
        </div>
      </div>
    </div>
  );
}
