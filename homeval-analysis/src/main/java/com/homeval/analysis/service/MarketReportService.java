package com.homeval.analysis.service;

import com.homeval.analysis.model.PropertyData;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;
import java.util.Map;


@Service
public class MarketReportService {

    private static final Logger log = LoggerFactory.getLogger(MarketReportService.class);

    public byte[] buildPdfReport(
            Map<String, Object> marketAnalytics,
            PropertyData baseRecord,
            Map<String, Object> counterfactualResult,
            List<Map<String, Object>> appendixRecords
    ) {
        if (marketAnalytics == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "marketAnalytics 不能为空");
        if (baseRecord == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "baseRecord 不能为空");
        if (counterfactualResult == null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "counterfactualResult 不能为空");

        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            PDType0Font cjk = tryLoadCjkFont(doc);

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                float pageW = page.getMediaBox().getWidth();
                float pageH = page.getMediaBox().getHeight();

                Color navy = new Color(30, 41, 59);
                Color blue = new Color(37, 99, 235);
                Color subtle = new Color(241, 245, 249);
                Color border = new Color(226, 232, 240);
                Color textMuted = new Color(71, 85, 105);
                Color green = new Color(22, 163, 74);
                Color red = new Color(220, 38, 38);

                String reportId = "RE-" + ZonedDateTime.now(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
                String generatedAt = ZonedDateTime.now(ZoneId.systemDefault()).format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));

                fillRect(cs, 0, pageH - 110, pageW, 110, navy);
                fillRect(cs, 0, pageH - 114, pageW, 4, blue);

                drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 18, 48, pageH - 52, "AI 资产改造与投资决策意向书", Color.WHITE);
                drawText(cs, cjk, PDType1Font.HELVETICA, 9, 48, pageH - 74,
                        "基于反事实改造回归预测引擎（Counterfactual Valuation Engine）的深度推演",
                        new Color(203, 213, 225));

                float rightX = pageW - 48;
                drawTextRight(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, rightX, pageH - 44, "报告编号： " + reportId, Color.WHITE);
                drawTextRight(cs, cjk, PDType1Font.HELVETICA, 9, rightX, pageH - 62, "生成时间： " + generatedAt, new Color(203, 213, 225));
                drawTextRight(cs, cjk, PDType1Font.HELVETICA, 9, rightX, pageH - 80, "大盘底色： House Price Matrix v1.4", new Color(203, 213, 225));

                float cursorY = pageH - 140;
                float marginX = 48;

                cursorY = drawSectionTitle(cs, cjk, cursorY, marginX, "一、 当前检索之宏观细分市场底色（Market Segment Background）", blue, textMuted);
                cursorY -= 10;

                Map<String, Object> stats = safeMap(marketAnalytics.get("stats"));
                int recordCount = toInt(stats.get("record_count"));
                double minPrice = toDouble(stats.get("min_price"));
                double maxPrice = toDouble(stats.get("max_price"));
                double avgPpsf = toDouble(stats.get("avg_price_per_sqft"));

                float cardY = cursorY - 62;
                float cardH = 56;
                float cardGap = 14;
                float cardW = (pageW - marginX * 2 - cardGap * 2) / 3f;

                drawStatCard(cs, cjk, marginX, cardY, cardW, cardH, border, subtle, "大盘符合条件样本总数", String.format(Locale.US, "%,d 套", recordCount));
                drawStatCard(cs, cjk, marginX + cardW + cardGap, cardY, cardW, cardH, border, subtle, "价格区间", String.format(Locale.US, "$%,.0f - $%,.0f", minPrice, maxPrice));
                drawStatCard(cs, cjk, marginX + (cardW + cardGap) * 2, cardY, cardW, cardH, border, subtle, "平均每平方英尺单价", String.format(Locale.US, "$%.1f / sqft", avgPpsf));

                cursorY = cardY - 30;

                cursorY = drawSectionTitle(cs, cjk, cursorY, marginX, "二、 微观房源反事实模拟沙盒对齐（What-If Renovation Benchmark）", blue, textMuted);
                cursorY -= 10;

                float tableX = marginX;
                float tableW = pageW - marginX * 2;
                float rowH = 26;
                float headH = 28;
                float tableTop = cursorY;

                String[] headers = new String[]{"对比维度（Metrics）", "原始事实状态（Base）", "反事实状态（Simulated）", "状态差值（Delta）"};
                float[] colW = new float[]{tableW * 0.28f, tableW * 0.24f, tableW * 0.24f, tableW * 0.24f};
                drawTableHeader(cs, cjk, tableX, tableTop, colW, headH, border, subtle, headers);

                Double simulatedPrice = toNullableDouble(counterfactualResult.get("simulated_price"));
                Double delta = toNullableDouble(counterfactualResult.get("delta"));

                Object baseFeaturesObj = counterfactualResult.get("base_features");
                Map<String, Object> baseFeatures = safeMap(baseFeaturesObj);
                Object simulatedFeaturesObj = counterfactualResult.get("simulated_features");
                Map<String, Object> simulatedFeatures = safeMap(simulatedFeaturesObj);

                String sqft = String.format(Locale.US, "%,.0f sqft", toDouble(baseFeatures.getOrDefault("square_footage", baseRecord.getSquareFootage())));
                String yearBuilt = String.valueOf(toInt(baseFeatures.getOrDefault("year_built", baseRecord.getYearBuilt())));
                String bedroomsBase = String.format(Locale.US, "%d 间", toInt(baseFeatures.getOrDefault("bedrooms", baseRecord.getBedrooms())));
                String bathroomsBase = String.format(Locale.US, "%.1f 间", toDouble(baseFeatures.getOrDefault("bathrooms", baseRecord.getBathrooms())));
                String schoolBase = String.format(Locale.US, "%.1f", toDouble(baseFeatures.getOrDefault("school_rating", baseRecord.getSchoolRating())));

                String bedroomsSim = String.format(Locale.US, "%d 间", toInt(simulatedFeatures.getOrDefault("bedrooms", baseRecord.getBedrooms())));
                String bathroomsSim = String.format(Locale.US, "%.1f 间", toDouble(simulatedFeatures.getOrDefault("bathrooms", baseRecord.getBathrooms())));
                String schoolSim = String.format(Locale.US, "%.1f", toDouble(simulatedFeatures.getOrDefault("school_rating", baseRecord.getSchoolRating())));

                float y = tableTop - headH;
                y = drawRow(cs, cjk, tableX, y, colW, rowH, border, "建筑面积（Square Footage）", sqft, sqft, "0（静止控制变量）", textMuted, blue);
                y = drawRow(cs, cjk, tableX, y, colW, rowH, border, "建造年份（Year Built）", yearBuilt + " 年", yearBuilt + " 年", "0（静止控制变量）", textMuted, blue);
                y = drawRow(cs, cjk, tableX, y, colW, rowH, border, "卧室数量（Bedrooms）", bedroomsBase, bedroomsSim,
                        deltaTextInt(toInt(simulatedFeatures.getOrDefault("bedrooms", baseRecord.getBedrooms())) - toInt(baseFeatures.getOrDefault("bedrooms", baseRecord.getBedrooms()))),
                        textMuted, blue);
                y = drawRow(cs, cjk, tableX, y, colW, rowH, border, "浴室数量（Bathrooms）", bathroomsBase, bathroomsSim,
                        deltaTextDouble(toDouble(simulatedFeatures.getOrDefault("bathrooms", baseRecord.getBathrooms())) - toDouble(baseFeatures.getOrDefault("bathrooms", baseRecord.getBathrooms()))),
                        textMuted, blue);
                y = drawRow(cs, cjk, tableX, y, colW, rowH, border, "周边评分（School Rating）", schoolBase, schoolSim,
                        deltaTextDouble(toDouble(simulatedFeatures.getOrDefault("school_rating", baseRecord.getSchoolRating())) - toDouble(baseFeatures.getOrDefault("school_rating", baseRecord.getSchoolRating()))),
                        textMuted, blue);

                String basePriceText = String.format(Locale.US, "$%,.0f", baseRecord.getPrice());
                String simPriceText = simulatedPrice == null ? "—" : String.format(Locale.US, "$%,.0f", simulatedPrice);
                String deltaText = delta == null ? "—" : String.format(Locale.US, "%s$%,.0f", delta >= 0 ? "+" : "-", Math.abs(delta));
                y = drawRowPrice(cs, cjk, tableX, y, colW, rowH, border, "大盘公允估值 / AI 预测", basePriceText, simPriceText, deltaText, green, red);

                cursorY = y - 24;

                cursorY = drawSectionTitle(cs, cjk, cursorY, marginX, "三、 附录： 当前大盘筛选后的明细网格清单（Filtered Appendix Grid）", blue, textMuted);
                cursorY -= 10;

                float appTop = cursorY;
                float appRowH = 20;
                float appHeadH = 22;
                String[] appHeaders = new String[]{"房源ID", "建筑面积(sqft)", "卧室数", "浴室数", "地皮大小", "中心距离", "学区评分", "大盘估价"};
                float[] appColW = new float[]{
                        tableW * 0.10f,
                        tableW * 0.14f,
                        tableW * 0.10f,
                        tableW * 0.10f,
                        tableW * 0.14f,
                        tableW * 0.12f,
                        tableW * 0.10f,
                        tableW * 0.20f
                };

                drawTableHeader(cs, cjk, tableX, appTop, appColW, appHeadH, border, subtle, appHeaders);
                float appY = appTop - appHeadH;
                int limit = Math.min(15, appendixRecords == null ? 0 : appendixRecords.size());
                for (int i = 0; i < limit; i++) {
                    Map<String, Object> r = appendixRecords.get(i);
                    appY = drawAppendixRow(cs, cjk, tableX, appY, appColW, appRowH, border, r, textMuted);
                }

                drawTextRight(cs, cjk, PDType1Font.HELVETICA, 8, pageW - marginX, 28, "第 1 页 / 共 1 页", new Color(148, 163, 184));
            }

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("生成 PDF 失败", e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "生成 PDF 失败: " + e.getMessage(), e);
        }
    }

    private PDType0Font tryLoadCjkFont(PDDocument doc) {
        try {
            File arialUnicode = new File("/System/Library/Fonts/Supplemental/Arial Unicode.ttf");
            if (arialUnicode.exists()) return PDType0Font.load(doc, arialUnicode);
        } catch (Exception ignored) {
        }
        return null;
    }

    private float drawSectionTitle(PDPageContentStream cs, PDType0Font cjk, float y, float x, String title, Color accent, Color textMuted) throws Exception {
        fillRect(cs, x, y - 6, 3, 18, accent);
        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 11, x + 10, y + 4, title, textMuted);
        return y - 18;
    }

    private void drawStatCard(PDPageContentStream cs, PDType0Font cjk, float x, float y, float w, float h, Color border, Color fill, String label, String value) throws Exception {
        fillRect(cs, x, y, w, h, Color.WHITE);
        strokeRect(cs, x, y, w, h, border);
        fillRect(cs, x, y + h - 1, w, 1, fill);
        drawText(cs, cjk, PDType1Font.HELVETICA, 8, x + 12, y + h - 18, label, new Color(71, 85, 105));
        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 14, x + 12, y + 18, value, new Color(15, 23, 42));
    }

    private void drawTableHeader(PDPageContentStream cs, PDType0Font cjk, float x, float topY, float[] colW, float h, Color border, Color fill, String[] headers) throws Exception {
        fillRect(cs, x, topY - h, sum(colW), h, fill);
        strokeRect(cs, x, topY - h, sum(colW), h, border);
        float cx = x;
        for (int i = 0; i < headers.length; i++) {
            if (i > 0) strokeLine(cs, cx, topY - h, cx, topY, border);
            drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, cx + 8, topY - 18, headers[i], new Color(30, 41, 59));
            cx += colW[i];
        }
    }

    private float drawRow(PDPageContentStream cs, PDType0Font cjk, float x, float topY, float[] colW, float h, Color border,
                          String metric, String base, String simulated, String delta, Color textMuted, Color deltaBlue) throws Exception {
        fillRect(cs, x, topY - h, sum(colW), h, Color.WHITE);
        strokeRect(cs, x, topY - h, sum(colW), h, border);
        float cx = x;
        String[] cells = new String[]{metric, base, simulated, delta};
        Color[] colors = new Color[]{new Color(30, 41, 59), new Color(15, 23, 42), new Color(37, 99, 235), deltaBlue};
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) strokeLine(cs, cx, topY - h, cx, topY, border);
            drawText(cs, cjk, PDType1Font.HELVETICA, 9, cx + 8, topY - 17, cells[i], colors[i]);
            cx += colW[i];
        }
        return topY - h;
    }

    private float drawRowPrice(PDPageContentStream cs, PDType0Font cjk, float x, float topY, float[] colW, float h, Color border,
                               String metric, String base, String simulated, String delta, Color green, Color red) throws Exception {
        fillRect(cs, x, topY - h, sum(colW), h, new Color(240, 253, 244));
        strokeRect(cs, x, topY - h, sum(colW), h, border);
        float cx = x;
        if (cx > x) { }
        strokeLine(cs, x + colW[0], topY - h, x + colW[0], topY, border);
        strokeLine(cs, x + colW[0] + colW[1], topY - h, x + colW[0] + colW[1], topY, border);
        strokeLine(cs, x + colW[0] + colW[1] + colW[2], topY - h, x + colW[0] + colW[1] + colW[2], topY, border);

        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, x + 8, topY - 17, metric, new Color(20, 83, 45));
        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, x + colW[0] + 8, topY - 17, base, new Color(15, 23, 42));
        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, x + colW[0] + colW[1] + 8, topY - 17, simulated, red);
        drawText(cs, cjk, PDType1Font.HELVETICA_BOLD, 9, x + colW[0] + colW[1] + colW[2] + 8, topY - 17, delta, green);
        return topY - h;
    }

    private float drawAppendixRow(PDPageContentStream cs, PDType0Font cjk, float x, float topY, float[] colW, float h, Color border,
                                  Map<String, Object> r, Color textMuted) throws Exception {
        fillRect(cs, x, topY - h, sum(colW), h, Color.WHITE);
        strokeRect(cs, x, topY - h, sum(colW), h, border);

        String id = "#" + toInt(r.get("id"));
        String sqft = String.format(Locale.US, "%,.0f", toDouble(r.get("square_footage")));
        String bed = String.valueOf(toInt(r.get("bedrooms")));
        String bath = String.format(Locale.US, "%.1f", toDouble(r.get("bathrooms")));
        String lot = String.format(Locale.US, "%,.0f", toDouble(r.get("lot_size")));
        String dist = String.format(Locale.US, "%.1f", toDouble(r.get("distance_to_city_center")));
        String school = String.format(Locale.US, "%.1f", toDouble(r.get("school_rating")));
        String price = String.format(Locale.US, "$%,.0f", toDouble(r.get("price")));

        String[] cells = new String[]{id, sqft, bed, bath, lot, dist, school, price};
        float cx = x;
        for (int i = 0; i < cells.length; i++) {
            if (i > 0) strokeLine(cs, cx, topY - h, cx, topY, border);
            drawText(cs, cjk, PDType1Font.HELVETICA, 8.5f, cx + 6, topY - 14.5f, cells[i], textMuted);
            cx += colW[i];
        }
        return topY - h;
    }

    private void fillRect(PDPageContentStream cs, float x, float y, float w, float h, Color c) throws Exception {
        cs.setNonStrokingColor(c);
        cs.addRect(x, y, w, h);
        cs.fill();
    }

    private void strokeRect(PDPageContentStream cs, float x, float y, float w, float h, Color c) throws Exception {
        cs.setStrokingColor(c);
        cs.setLineWidth(1f);
        cs.addRect(x, y, w, h);
        cs.stroke();
    }

    private void strokeLine(PDPageContentStream cs, float x1, float y1, float x2, float y2, Color c) throws Exception {
        cs.setStrokingColor(c);
        cs.setLineWidth(1f);
        cs.moveTo(x1, y1);
        cs.lineTo(x2, y2);
        cs.stroke();
    }

    private void drawText(PDPageContentStream cs, PDType0Font cjk, org.apache.pdfbox.pdmodel.font.PDFont fallback, float size, float x, float y, String text, Color c) throws Exception {
        cs.beginText();
        try {
            cs.setNonStrokingColor(c);
            cs.setFont(cjk != null ? cjk : fallback, size);
            cs.newLineAtOffset(x, y);
            cs.showText(text);
        } finally {
            cs.endText();
        }
    }

    private void drawTextRight(PDPageContentStream cs, PDType0Font cjk, org.apache.pdfbox.pdmodel.font.PDFont fallback, float size, float rightX, float y, String text, Color c) throws Exception {
        float textWidth = (cjk != null ? cjk.getStringWidth(text) : fallback.getStringWidth(text)) / 1000f * size;
        drawText(cs, cjk, fallback, size, rightX - textWidth, y, text, c);
    }

    private float sum(float[] xs) {
        float s = 0;
        for (float x : xs) s += x;
        return s;
    }

    private Map<String, Object> safeMap(Object obj) {
        if (obj instanceof Map<?, ?> map) {
            return (Map<String, Object>) map;
        }
        return Map.of();
    }

    private int toInt(Object obj) {
        if (obj instanceof Number n) return n.intValue();
        if (obj instanceof String s) {
            try { return Integer.parseInt(s); } catch (Exception ignored) {}
        }
        return 0;
    }

    private double toDouble(Object obj) {
        if (obj instanceof Number n) return n.doubleValue();
        if (obj instanceof String s) {
            try { return Double.parseDouble(s); } catch (Exception ignored) {}
        }
        return 0.0;
    }

    private Double toNullableDouble(Object obj) {
        if (obj == null) return null;
        if (obj instanceof Number n) return n.doubleValue();
        if (obj instanceof String s) {
            try { return Double.parseDouble(s); } catch (Exception ignored) {}
        }
        return null;
    }

    private String deltaTextInt(int diff) {
        if (diff == 0) return "0";
        return (diff > 0 ? "+" : "") + diff;
    }

    private String deltaTextDouble(double diff) {
        if (Math.abs(diff) < 1e-9) return "0.0";
        return String.format(Locale.US, "%+.1f", diff);
    }
}
