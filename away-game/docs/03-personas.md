# 3 · Personas

## Practice persona from class: Theo Williams

In class I built a persona for a different problem (a college study-space finder): **Theo Williams**, 25, a career changer who lives off campus and bikes in. [Original sketch](original-work/persona-theo-williams.jpg).

What I took from building Theo, and reused below:

- **Attribute sliders** (solo↔group, quiet↔loud, indoor↔outdoor, session length) were the most useful part. They made trade-offs visible at a glance and forced me to commit to a position instead of saying "it depends."
- **Goals and frustrations were paired.** Almost every frustration ("no outlets," "busy during finals") was the flip side of a goal. I kept that structure.
- **"Common tasks" was the weakest section.** It listed features Theo might want ("book a group spot ahead of time") rather than things Theo actually does. For this project I replaced it with **key decisions**, pulled straight from the task model, so the persona and the task model describe the same person.

## Status: proto-personas

These are **proto-personas**: built from the task model, class discussion, and assumptions, not yet from interviews. Every claim marked **(A)** is an assumption to check. When I interview athletes (see the [task model's next steps](01-task-model.md#limits-of-this-model-and-next-steps)), I'll update these and log what changed.

---

## Primary persona: Amara Okafor

> "I can run a hard 800 on no sleep. What I can't do is figure out where to run it."

**20 · junior · varsity 800m runner · travels to 6–8 meets a season plus a summer training block abroad**

### Background

Amara has been competing since she was 13, and her routine at home is dialed in: same track, same gym, same meals from the dining hall. Travel breaks all of it at once. She relies heavily on her coach's plan and doesn't like improvising. **(A)** Her phone is her lifeline on trips, which is exactly the problem when she's on a roaming plan with 2 GB of data.

### Attributes

```
Solo          ●─────────────────── Team         (trains alone on travel days, even with the team there)
Plan-follower ●─────────────────── Improviser
Low-tech      ──────────────●───── Tech-reliant
Honest about  ──────────────●───── Pushes through fatigue (A)
  fatigue
Picky eater   ─────────●────────── Eats anything
```

### Goals

- Hit the key sessions in the plan, even when traveling.
- Show up to competition feeling rested, not just "not injured."
- Spend as little mental energy as possible on logistics.

### Frustrations

- Hotel gym photos that turn out to be a treadmill and a yoga mat.
- Map reviews written by tourists, not athletes ("nice view!" says nothing about whether there's a track).
- Not knowing if her coach would be fine with her skipping a session, and not being able to ask because it's 4am at home.
- Feeling like a rest day is a failure. **(A)**
- Losing signal or battery right when she needs directions.

### Key decisions (from the task model)

| Decision | How Amara tends to handle it |
|---|---|
| D1 "How wrecked am I?" | Says "I'm fine" and means it about 60% of the time **(A)** |
| D2/D3 "Can I skip today?" | Won't skip without permission; if she can't reach the coach, she trains |
| D4/D5 "Where can I train?" | Asks teammates first, then maps; will walk up to ~20 minutes |
| D7 "What can I eat?" | Sticks to familiar food before a race; more adventurous after |
| D8 "Did today count?" | Reports good sessions quickly, bad ones late or never **(A)** |

### What she needs from Away Game

A single glance that tells her whether today is a train day or a recovery day, and that her coach already agreed to that call.

---

## Secondary persona: Coach Dana Reyes

> "I don't need them to be perfect on the road. I need to know when something's off before it's a problem."

**44 · distance coach · 18 athletes · doesn't travel with the team for every trip**

### Background

Coach Reyes writes the training plans and adjusts them based on how athletes respond. When athletes travel without her (summer blocks, split meets), her information goes from daily and in-person to scattered texts. **(A)** She'd rather set clear rules ahead of time than be woken up at 3am with "should I run today?"

### Attributes

```
Hands-on      ─────────●────────── Hands-off
Wants detail  ──────────────●───── Wants summary
Tech-averse   ─────────●────────── Tech-comfortable
```

### Goals

- Know which athletes are struggling on a trip, early.
- Let athletes make good calls without waiting for her.
- Keep the plan intact on key days and flexible on the rest.

### Frustrations

- Radio silence from athletes having a bad trip.
- Being the bottleneck for every small decision across time zones.
- Tools that give her 18 dashboards of raw data instead of "who needs a message from me today."

### What she needs from Away Game

To set readiness rules once before the trip, and get a short summary of who followed the plan, who rested, and who's struggling.

---

## Anti-persona: the vacation gym-goer

**Jordan, 34, wants to keep up workouts on holiday.**

Jordan has overlapping needs (finding a gym in a new city) but no coach, no training plan, and no competition. Designing for Jordan would pull Away Game toward a general gym-finder, which already exists. Naming Jordan helps keep the scope on athletes whose travel has *stakes*.

---

## How the personas changed the design

- Amara's **plan-follower** trait is why the readiness verdict is framed as the coach's rule, not the app's opinion. She'd ignore an app telling her to rest; she won't ignore her coach.
- Amara's **heavy reliance on her phone** plus B10 is why the prototype works offline and keeps a paper passport fallback.
- Coach Reyes wanting a **summary, not detail** is why the coach view shows a single status line per athlete instead of charts.
- The **anti-persona** is why generic features (star ratings, reviews, "popular" gyms) were left out of the places list.
