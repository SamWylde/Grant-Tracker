type CalendarMilestone = {
  label: string;
  dueDate: string | null;
};

type CalendarGrant = {
  id: string;
  title: string;
  milestones: CalendarMilestone[];
};

type GenerateIcsArgs = {
  grants: CalendarGrant[];
  timezone: string;
  orgName: string;
};

function formatDateForIcs(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

  const year = parts.year ?? "0000";
  const month = parts.month ?? "01";
  const day = parts.day ?? "01";
  const hour = parts.hour ?? "00";
  const minute = parts.minute ?? "00";
  const second = parts.second ?? "00";

  return `${year}${month}${day}T${hour}${minute}${second}`;
}

export function generateIcsFeed({ grants, timezone, orgName }: GenerateIcsArgs): string {
  const now = new Date();
  const dtStamp = formatDateForIcs(now, "UTC");
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Grant Tracker//Calendar//EN",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${orgName} Deadlines`,
    `X-WR-TIMEZONE:${timezone}`
  ];

  for (const grant of grants) {
    for (const milestone of grant.milestones) {
      if (!milestone.dueDate) continue;
      const due = new Date(`${milestone.dueDate}T09:00:00`);
      const start = formatDateForIcs(due, timezone);
      const endDate = new Date(due.getTime() + 60 * 60 * 1000);
      const end = formatDateForIcs(endDate, timezone);
      const uid = `${grant.id}-${milestone.label}`.replace(/\s+/g, "-");
      const description = `${milestone.label} due for ${grant.title}`;

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}@grant-tracker.local`,
        `DTSTAMP:${dtStamp}Z`,
        `DTSTART;TZID=${timezone}:${start}`,
        `DTEND;TZID=${timezone}:${end}`,
        `SUMMARY:${milestone.label} · ${grant.title}`,
        `DESCRIPTION:${description}`,
        "END:VEVENT"
      );
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
