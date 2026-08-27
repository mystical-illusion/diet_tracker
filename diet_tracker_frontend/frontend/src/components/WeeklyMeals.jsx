import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { format } from "date-fns";

const MEAL_ICONS = {
  breakfast: "🌅",
  lunch: "☀️",
  dinner: "🌙",
  snack: "🍎",
  general: "🍽️",
};

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

export default function WeeklyMeals() {
  const { user } = useAuthStore();
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState(null);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://127.0.0.1:5001/analytics/weekly-organized?user_id=${user?.id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await response.json();
      setWeeklyData(data.weekly || []);

      // expand today by default
      if (data.weekly?.length > 0) {
        setExpandedDay(data.weekly[0].date);
      }
    } catch {}
    setLoading(false);
  };

  if (loading)
    return (
      <div className="card">
        <p style={{ color: "var(--text-muted)", fontSize: 13 }}>
          Loading weekly meals...
        </p>
      </div>
    );

  return (
    <div className="card">
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>
        📅 Weekly Meal Log
      </p>

      {weeklyData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📅</div>
          <div className="empty-state-title">No meals logged yet</div>
        </div>
      ) : (
        <div className="col gap-3">
          {weeklyData.map((day) => (
            <div
              key={day.date}
              style={{
                border: "1px solid var(--border)",
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              {/* Day Header */}
              <div
                onClick={() =>
                  setExpandedDay(expandedDay === day.date ? null : day.date)
                }
                style={{
                  padding: "12px 16px",
                  background: "var(--surface-2)",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {format(new Date(day.date + "T00:00"), "EEEE, MMM d")}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                    }}
                  >
                    {MEAL_TYPES.reduce(
                      (count, type) => count + (day[type]?.length || 0),
                      0,
                    )}{" "}
                    meals logged
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      color: "var(--cyan)",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {day.total_calories} kcal
                  </span>
                  <span
                    style={{
                      color: "var(--text-muted)",
                      fontSize: 12,
                    }}
                  >
                    {expandedDay === day.date ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Expanded Day */}
              {expandedDay === day.date && (
                <div style={{ padding: "12px 16px" }}>
                  {MEAL_TYPES.map(
                    (type) =>
                      day[type]?.length > 0 && (
                        <div
                          key={type}
                          style={{
                            marginBottom: 12,
                          }}
                        >
                          {/* Meal Type Header */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginBottom: 6,
                              paddingBottom: 4,
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <span>{MEAL_ICONS[type]}</span>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 13,
                                textTransform: "capitalize",
                              }}
                            >
                              {type}
                            </span>
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: 12,
                                color: "var(--cyan)",
                              }}
                            >
                              {day[type].reduce(
                                (sum, m) => sum + m.calories,
                                0,
                              )}{" "}
                              kcal
                            </span>
                          </div>

                          {/* Meals in this type */}
                          {day[type].map((meal) => (
                            <div
                              key={meal.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "4px 0",
                                fontSize: 13,
                              }}
                            >
                              <span>{meal.food}</span>
                              <span
                                style={{
                                  color: "var(--text-muted)",
                                }}
                              >
                                {meal.calories} cal
                              </span>
                            </div>
                          ))}
                        </div>
                      ),
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
