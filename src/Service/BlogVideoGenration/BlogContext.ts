import IBlogData from "../../Interface/DataInterface/IBlogData";

const MAX_TEXT_CHARS = 400;

const clip = (text: unknown) => String(text ?? "").slice(0, MAX_TEXT_CHARS);

interface IRouteStop {
    order: number;
    place: string;
    days: number[];
    activities: { day: number; time: string; activityType: string; description: string; tips: string[] }[];
}

// The places in the order the traveller visited them (by day, then time). A place visited again keeps its first position.
const buildRoute = (blog: IBlogData): IRouteStop[] => {
    const sorted = [...blog.activities].sort(
        (a, b) => a.day - b.day || String(a.time).localeCompare(String(b.time))
    );

    const stops = new Map<string, IRouteStop>();
    for (const a of sorted) {
        const key = a.placeName.trim().toLowerCase();
        if (!key) continue;
        if (!stops.has(key)) {
            stops.set(key, { order: stops.size + 1, place: a.placeName, days: [], activities: [] });
        }
        const stop = stops.get(key)!;
        if (!stop.days.includes(a.day)) stop.days.push(a.day);
        stop.activities.push({
            day: a.day,
            time: a.time,
            activityType: a.activityType,
            description: clip(a.description),
            tips: a.tips,
        });
    }
    return [...stops.values()];
};

// Text-only view of a blog for the AI. Images, coordinates and links are left out on purpose.
export const buildBlogContext = (blog: IBlogData) => ({
    tripTitle: blog.tripTitle,
    tripOverview: clip(blog.tripOverview),
    tripDuration: blog.tripDuration,
    totalSpent: blog.totalSpent,
    metaData: blog.metaData,
    route: buildRoute(blog),
    activities: blog.activities.map((a) => ({
        day: a.day,
        placeName: a.placeName,
        activityType: a.activityType,
        time: a.time,
        description: clip(a.description),
        tips: a.tips,
        amountSpent: a.amountSpent,
        sideActivities: (a.sideActivities || []).map((s) => s.placeName),
    })),
    hotels: blog.hotel.map((h) => ({
        name: h.name,
        address: h.address,
        checkInDate: h.checkInDate,
        checkOutDate: h.checkOutDate,
        description: clip(h.description),
    })),
    travel: blog.travel.map((t) => ({
        day: t.day,
        travelType: t.travelType,
        time: t.time,
        description: clip(t.description),
    })),
});

export type BlogContext = ReturnType<typeof buildBlogContext>;
