# Downstream Customization Guide

## 1) Module Rules
Edit `configs/module_rules.yaml`:
- define allowed paths
- define forbidden dependency directions

## 2) Skills
Edit `configs/skills_index.yaml`:
- register local skills
- declare purpose/risk level

## 3) Document Templates
Edit files in `docs/templates/`:
- metadata controls ownership and lifecycle triggers
- body controls markdown output using `{{token}}`

## 4) Output Paths
Override output paths during registry loading (code example in `examples/customize_starter.py`).
