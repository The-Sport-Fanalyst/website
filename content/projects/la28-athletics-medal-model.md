---
title: LA28 Athletics Medal Predictor
creator: Maya Okonkwo
sport: Athletics
category: Models
description: A gradient-boosted model that projects medal probabilities for LA28 track finals using season-best progressions, championship history, and altitude-adjusted marks.
status: Seeking collaborators
github_url: https://github.com/thesportfanalyst/la28-athletics-medal-model
demo_url: https://thesportfanalyst.github.io/la28-athletics-medal-model
data_sources: [World Athletics season bests, Olympic finals archive 1996–2024, Diamond League results]
contributors: [Daniel Reyes]
created_date: 2026-02-11
featured: true
games: [Summer, Olympics]
---

## Overview

This model estimates medal probabilities for every LA28 athletics final. It blends each athlete's season-best progression with a championship-performance adjustment — top athletes tend to peak at the Games, not before.

## Methodology

We train a gradient-boosted classifier on finals from 1996 onward, with features for season-best percentile, year-over-year improvement, championship podium history, and event-specific variance. Predictions are calibrated and published with uncertainty bands — no point estimate without a range.

## How to help

We're looking for collaborators on Para T/F class coverage and on a wind-adjustment layer for sprints and horizontal jumps. Open an issue or claim one on the community board.
