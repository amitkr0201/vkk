#!/bin/bash

npx eleventy build --output docs
git add docs
git commit
git push
