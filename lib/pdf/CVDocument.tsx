import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CVStructure } from "@/lib/pots/cv-structure";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#444",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: "bold",
  },
  itemSubtitle: {
    fontSize: 10,
    color: "#555",
    marginBottom: 4,
  },
  bullet: {
    marginLeft: 12,
    marginBottom: 2,
    fontSize: 10,
  },
  skillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  skillTag: {
    backgroundColor: "#eee",
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
  },
});

export interface TailoredCV extends CVStructure {
  tailoredSummary?: string;
  tailoredBullets?: Record<string, string[]>; // section item title -> bullets
}

export function CVDocument({ cv }: { cv: TailoredCV }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{cv.headline}</Text>
        {cv.tailoredSummary && (
          <Text style={styles.subtitle}>{cv.tailoredSummary}</Text>
        )}

        {cv.sections.map((section) => (
          <View key={section.type}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => {
              const key = item.title || `${section.type}-${i}`;
              const bullets =
                cv.tailoredBullets?.[key] ?? item.bullets;
              return (
                <View key={key} wrap={false}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  )}
                  {bullets.map((b, j) => (
                    <Text key={j} style={styles.bullet}>
                      • {b}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        ))}

        {cv.skillsSummary.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsRow}>
              {cv.skillsSummary.map((s) => (
                <Text key={s} style={styles.skillTag}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
}
