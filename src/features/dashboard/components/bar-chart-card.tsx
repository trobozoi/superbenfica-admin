"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState, ErrorState } from "@/components/shared/feedback";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export interface BarDatum {
  label: string;
  value: number;
}

interface BarChartCardProps {
  title: string;
  description?: string;
  data: BarDatum[] | undefined;
  isLoading?: boolean;
  error?: unknown;
  /** Formata valores no eixo, no tooltip e na tabela acessível. */
  formatValue?: (value: number) => string;
  /** Barras horizontais: melhor para rótulos longos (nomes de filiais/produtos). */
  horizontal?: boolean;
}

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 12 };

/**
 * Gráfico de barras de série única: uma cor (chart-1), sem legenda (o título nomeia a
 * série), grade recessiva, tooltip ao passar o mouse e tabela equivalente para leitores
 * de tela.
 */
export function BarChartCard({
  title,
  description,
  data,
  isLoading,
  error,
  formatValue = String,
  horizontal = false,
}: Readonly<BarChartCardProps>) {
  const renderContent = () => {
    if (isLoading) return <Skeleton className="h-64 w-full" />;
    if (error) return <ErrorState error={error} />;
    if (!data?.length) return <EmptyState />;
    return (
      <>
        <div className="h-64 w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout={horizontal ? "vertical" : "horizontal"}
              margin={{ top: 8, right: 16, bottom: 0, left: horizontal ? 8 : 0 }}
              barCategoryGap={horizontal ? 6 : "20%"}
            >
              <CartesianGrid
                stroke="var(--color-border)"
                strokeDasharray="3 3"
                vertical={horizontal}
                horizontal={!horizontal}
              />
              {horizontal ? (
                <>
                  <XAxis
                    type="number"
                    tick={AXIS_TICK}
                    tickFormatter={formatValue}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={AXIS_TICK}
                    width={110}
                    axisLine={false}
                    tickLine={false}
                  />
                </>
              ) : (
                <>
                  <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={AXIS_TICK}
                    tickFormatter={formatValue}
                    width={64}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                </>
              )}
              <Tooltip
                cursor={{ fill: "var(--color-muted)", opacity: 0.6 }}
                formatter={(value) => [formatValue(Number(value)), title]}
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-popover-foreground)",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="value"
                fill="var(--color-chart-1)"
                radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>{title}</caption>
          <tbody>
            {data.map((item) => (
              <tr key={item.label}>
                <th scope="row">{item.label}</th>
                <td>{formatValue(item.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}
