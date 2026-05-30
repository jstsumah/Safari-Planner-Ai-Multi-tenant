const locations = ["Nairobi", "Masai Mara", "Serengeti"];
const saddr = encodeURIComponent(locations[0]);
let daddr = "";
if (locations.length > 1) {
  daddr = encodeURIComponent(locations.slice(1).join(" to ")); // Wait! The correct format for daddr with multiple waypoints in the old maps is `point1+to:point2+to:point3` -> wait, it's `waypoint1+to:waypoint2`.
}
console.log(`https://maps.google.com/maps?saddr=${saddr}&daddr=${encodeURIComponent(locations[locations.length - 1])}&output=embed`);
