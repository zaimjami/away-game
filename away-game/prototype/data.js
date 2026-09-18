// Sample trip data for the prototype.
// All places are FICTIONAL placeholders for a Lisbon trip. Replace with real
// athlete-verified data before any user testing.

window.AWAY_DATA = {
  trip: {
    city: "Lisbon",
    cityCode: "LIS",
    hotel: "Team hotel, Avenidas Novas",
    homeCity: "Boulder",
  },

  // Sessions the coach might assign, and what each one needs.
  sessions: {
    track_reps: { label: "6×200m at race pace", needs: ["track"] },
    tempo_run: { label: "30 min tempo run", needs: ["run_route"] },
    lift: { label: "Lower-body strength", needs: ["weights"] },
    swim_recovery: { label: "Recovery swim or walk", needs: ["pool", "run_route"] },
  },

  // Equivalent swaps when a place doesn't have what the plan needs (breakdown B6).
  swaps: {
    track_reps: [
      { needs: ["run_route"], label: "6×40s surges on a measured flat loop" },
      { needs: ["treadmill"], label: "6×200m on treadmill at 1% incline, full recovery" },
      { needs: [], label: "Drills + 6×20s strides in a hallway or parking lot" },
    ],
    tempo_run: [
      { needs: ["treadmill"], label: "30 min tempo on treadmill" },
      { needs: [], label: "Bodyweight circuit, 3×10 min at steady effort" },
    ],
    lift: [
      { needs: ["dumbbells"], label: "Dumbbell split squats + RDLs, 4×8" },
      { needs: [], label: "Single-leg bodyweight circuit, 4 rounds" },
    ],
    swim_recovery: [
      { needs: ["run_route"], label: "20 min easy walk + mobility" },
      { needs: [], label: "Mobility and foam rolling in the room, 25 min" },
    ],
  },

  // Athlete-verified places. Deliberately no star ratings (see the anti-persona).
  places: [
    {
      id: "p1", kind: "train", name: "University stadium track",
      walk: 14, verified: 5, dayPass: "Free before 10am with student ID",
      hours: "7:00–21:00", has: ["track", "run_route"],
      note: "400m, 8 lanes. Busy with club sprinters after 17:00.",
    },
    {
      id: "p2", kind: "train", name: "Hotel fitness room",
      walk: 0, verified: 2, dayPass: "Included",
      hours: "24 h", has: ["treadmill", "dumbbells"],
      note: "Two treadmills, dumbbells to 20 kg. No rack.",
    },
    {
      id: "p3", kind: "train", name: "Municipal pool, Arroios",
      walk: 11, verified: 3, dayPass: "€4.50",
      hours: "7:00–22:00", has: ["pool"],
      note: "25m, lane swim until 9:00, then crowded.",
    },
    {
      id: "p4", kind: "train", name: "Performance gym, Saldanha",
      walk: 9, verified: 4, dayPass: "€12",
      hours: "6:00–23:00", has: ["weights", "dumbbells", "treadmill"],
      note: "Two squat racks, platforms, bumper plates.",
    },
    {
      id: "p5", kind: "train", name: "Park loop, Campo Grande",
      walk: 17, verified: 6, dayPass: "Free",
      hours: "Always open", has: ["run_route"],
      note: "Flat 1.4 km loop, measured by a teammate.",
    },
    {
      id: "f1", kind: "food", name: "Rice & grilled chicken counter",
      walk: 5, verified: 4, tags: ["pre-race safe", "familiar"],
      hours: "11:00–22:00", note: "Plain plates on request. Sealed water.",
    },
    {
      id: "f2", kind: "food", name: "Supermarket, Av. da República",
      walk: 4, verified: 6, tags: ["sealed water", "familiar", "pre-race safe"],
      hours: "8:00–21:00", note: "Bananas, yogurt, oats, bottled water.",
    },
    {
      id: "f3", kind: "food", name: "Neighborhood tasca",
      walk: 8, verified: 2, tags: ["post-race"],
      hours: "12:00–15:00, 19:00–22:30", note: "Great after racing. Too rich before one.",
    },
  ],

  // Teammates shown in the coach view (static, for the demo).
  teammates: [
    { name: "Jonah", status: "red", line: "Slept 3.5h, trained anyway" },
    { name: "Priya", status: "green", line: "Followed plan: did track reps" },
    { name: "Marcus", status: "amber", line: "No summary yet" },
  ],
};
