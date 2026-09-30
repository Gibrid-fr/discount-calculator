import { useState } from "react";
import "./DiscountCalculator.css";

// Справочник категорий
const CATEGORIES = [
  { id: "electronics", label: "Электроника", discount: 5 },
  { id: "clothing",    label: "Одежда",      discount: 15 },
  { id: "groceries",   label: "Продукты",    discount: 10 },
  { id: "books",       label: "Книги",       discount: 20 },
  { id: "other",       label: "Другое",      discount: 0 },
];

const VAT_RATE = 0.22;          // 22%
const PROMO_CODE = "WELCOME10";
const PROMO_DISCOUNT = 10;      // +10%

function DiscountCalculator() {
  // --- Состояния ---
  const [items, setItems] = useState([
    { id: 1, price: "", category: "electronics" },
  ]);
  const [promo, setPromo] = useState("");
  const [customDiscount, setCustomDiscount] = useState(0);   // число 0..50
  const [withVat, setWithVat] = useState(true);
  const [calculated, setCalculated] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // --- Обработчики товаров ---
  function handleItemChange(id, field, value) {
    if (field === "price" && value !== "" && !/^\d*\.?\d*$/.test(value)) return;

    setItems(items.map((it) =>
      it.id === id ? { ...it, [field]: value } : it
    ));
    setCalculated(false);
    setError("");
  }

  function addItem() {
    setItems([...items, {
      id: Date.now(),
      price: "",
      category: "electronics",
    }]);
    setCalculated(false);
  }

  function removeItem(id) {
    if (items.length === 1) return;
    setItems(items.filter((it) => it.id !== id));
    setCalculated(false);
  }

  // --- Обработчики прочих полей ---
  function handlePromoChange(e) {
    setPromo(e.target.value);
    setCalculated(false);
  }

  function handleCustomDiscountChange(e) {
    setCustomDiscount(Number(e.target.value));
    setCalculated(false);
  }

  function handleVatToggle(e) {
    setWithVat(e.target.checked);
    setCalculated(false);
  }

  // --- Кнопка «Рассчитать» ---
  function handleCalculate() {
    for (const item of items) {
      const p = parseFloat(item.price);
      if (!item.price.trim() || isNaN(p) || p <= 0) {
        setError("У каждой позиции должна быть положительная цена");
        setCalculated(false);
        return;
      }
    }

    setError("");
    setCalculated(true);

    const total = calcTotals().total;
    const record = {
      id: Date.now(),
      date: new Date().toLocaleString("ru-RU"),
      count: items.length,
      total,
    };
    setHistory([record, ...history].slice(0, 5));
  }

  // --- Кнопка «Сбросить» ---
  function handleReset() {
    setItems([{ id: Date.now(), price: "", category: "electronics" }]);
    setPromo("");
    setCustomDiscount(0);
    setWithVat(true);
    setCalculated(false);
    setError("");
  }

  // --- Вычисления ---
  const promoActive = promo.trim().toUpperCase() === PROMO_CODE;
  const promoPercent = promoActive ? PROMO_DISCOUNT : 0;

  // Ползунок на 0 → работает скидка категории
  // Ползунок > 0 → его значение заменяет категорийную
  const useCustom = customDiscount > 0;

  function calcLine(item) {
    const price = parseFloat(item.price) || 0;
    const cat = CATEGORIES.find((c) => c.id === item.category);
    const baseDiscount = useCustom ? customDiscount : (cat ? cat.discount : 0);

    const discountPercent = baseDiscount + promoPercent;
    const discountAmount = price * (discountPercent / 100);
    const priceAfterDiscount = price - discountAmount;
    const vatAmount = withVat ? priceAfterDiscount * VAT_RATE : 0;
    const total = priceAfterDiscount + vatAmount;

    return {
      price,
      categoryLabel: cat ? cat.label : "—",
      baseDiscount,
      discountPercent,
      discountAmount,
      priceAfterDiscount,
      vatAmount,
      total,
    };
  }

  function calcTotals() {
    return items.reduce(
      (acc, item) => {
        const l = calcLine(item);
        return {
          price: acc.price + l.price,
          discountAmount: acc.discountAmount + l.discountAmount,
          priceAfterDiscount: acc.priceAfterDiscount + l.priceAfterDiscount,
          vatAmount: acc.vatAmount + l.vatAmount,
          total: acc.total + l.total,
        };
      },
      { price: 0, discountAmount: 0, priceAfterDiscount: 0, vatAmount: 0, total: 0 }
    );
  }

  const totals = calcTotals();

  function formatRub(value) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " ₽";
  }

  // --- Разметка ---
  return (
    <div className="calculator-wrapper">
      <h2 className="calculator-title">Калькулятор скидок</h2>

      {/* Список товаров */}
      <div className="items">
        <div className="items-header">
          <span>Товары ({items.length})</span>
          <button type="button" className="btn-mini" onClick={addItem}>
            + Добавить
          </button>
        </div>

        {items.map((item, idx) => (
          <div className="item-row" key={item.id}>
            <span className="item-num">{idx + 1}</span>
            <input
              type="text"
              className="field_input"
              placeholder="Цена"
              value={item.price}
              onChange={(e) => handleItemChange(item.id, "price", e.target.value)}
              inputMode="decimal"
            />
            <select
              className="field_input field_select"
              value={item.category}
              onChange={(e) => handleItemChange(item.id, "category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} — {c.discount}%
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-mini"
              onClick={() => removeItem(item.id)}
              disabled={items.length === 1}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Промокод */}
      <div className="field">
        <label className="field_label" htmlFor="promo">Промокод</label>
        <input
          id="promo"
          type="text"
          className="field_input"
          placeholder="Например: WELCOME10"
          value={promo}
          onChange={handlePromoChange}
        />
        {promoActive && (
          <span className="hint-ok">✓ Промокод применён: +{PROMO_DISCOUNT}%</span>
        )}
      </div>

      {/* Кастомная скидка */}
      <div className="field">
        <label className="field_label">
          Своя скидка: {customDiscount}%
          {useCustom && <span className="hint-info"> (заменяет категорийную)</span>}
        </label>
        <div className="range-row">
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={customDiscount}
            onChange={handleCustomDiscountChange}
            className="range"
          />
          <span className="range-value">{customDiscount}%</span>
        </div>
      </div>

      {/* НДС */}
      <div className="field">
        <label className="field_checkbox">
          <input type="checkbox" checked={withVat} onChange={handleVatToggle} />
          <span>Учитывать НДС 22%</span>
        </label>
      </div>

      {/* Ошибка */}
      {error && <div className="field_error">{error}</div>}

      {/* Кнопки */}
      <div className="actions">
        <button type="button" className="btn btn--primary" onClick={handleCalculate}>
          Рассчитать
        </button>
        <button type="button" className="btn btn--secondary" onClick={handleReset}>
          Сбросить
        </button>
      </div>

      {/* Результаты */}
      {calculated && (
        <div className="results">
          <h3 className="results_title">Результат расчёта</h3>

          {items.map((item, i) => {
            const l = calcLine(item);
            return (
              <div className="line" key={item.id}>
                <div className="line-head">
                  Позиция {i + 1} — {l.categoryLabel} · скидка {l.discountPercent}%
                  {promoPercent > 0 && ` (в т.ч. промо +${promoPercent}%)`}
                </div>
                <table className="results_table">
                  <tbody>
                    <tr>
                      <td>Цена</td>
                      <td className="results_value">{formatRub(l.price)}</td>
                    </tr>
                    <tr>
                      <td>Скидка</td>
                      <td className="results_value results_value--discount">
                        − {formatRub(l.discountAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td>После скидки</td>
                      <td className="results_value">{formatRub(l.priceAfterDiscount)}</td>
                    </tr>
                    {withVat && (
                      <tr>
                        <td>НДС 22%</td>
                        <td className="results_value">+ {formatRub(l.vatAmount)}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Итого по позиции</td>
                      <td className="results_value">{formatRub(l.total)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}

          <table className="results_table results_table--total">
            <tbody>
              <tr>
                <td>Сумма всех цен</td>
                <td className="results_value">{formatRub(totals.price)}</td>
              </tr>
              <tr>
                <td>Всего скидка</td>
                <td className="results_value results_value--discount">
                  − {formatRub(totals.discountAmount)}
                </td>
              </tr>
              {withVat && (
                <tr>
                  <td>Всего НДС</td>
                  <td className="results_value">+ {formatRub(totals.vatAmount)}</td>
                </tr>
              )}
              <tr className="results_row--total">
                <td>Итого к оплате</td>
                <td className="results_value">{formatRub(totals.total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* История */}
      {history.length > 0 && (
        <div className="history">
          <h3 className="results_title">Последние расчёты</h3>
          <ul className="history-list">
            {history.map((h) => (
              <li className="history-item" key={h.id}>
                <span className="history-date">{h.date}</span>
                <span>{h.count} поз. · <b>{formatRub(h.total)}</b></span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default DiscountCalculator;