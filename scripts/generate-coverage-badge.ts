#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { type InferOutput, number, object, optional, record, safeParse, string } from 'valibot'

const COVERAGE_FILE = path.resolve('./coverage/coverage-final.json')
const README_FILE = path.resolve('./README.md')
const BADGE_REGEX = /!\[Coverage\]\(https:\/\/img\.shields\.io\/badge\/coverage-\d+%25-[a-z]+\)/
const FIRST_HEADING_REGEX = /^# .+$/m

// Valibot Schemas
const StatementMapSchema = record(
  string(),
  object({ start: optional(object({})), end: optional(object({})) }),
)
const StatementsSchema = record(string(), number())

const CoverageDataSchema = object({
  statementMap: optional(StatementMapSchema),
  s: optional(StatementsSchema),
})

const CoverageSchema = record(string(), CoverageDataSchema)

// InferOutputを使用して型を推論
type CoverageData = InferOutput<typeof CoverageSchema>

/**
 * Process coverage data to calculate overall coverage percentage
 */
function calculateCoverage(coverageData: CoverageData): number {
  let totalStatements = 0
  let coveredStatements = 0

  for (const file of Object.values(coverageData)) {
    totalStatements += file.statementMap ? Object.keys(file.statementMap).length : 0
    coveredStatements += file.s ? Object.values(file.s).filter((v) => v > 0).length : 0
  }

  return totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0
}

/**
 * Determine badge color based on coverage percentage
 */
function getBadgeColor(coverage: number): string {
  if (coverage >= 90) {
    return 'brightgreen'
  }
  if (coverage >= 80) {
    return 'green'
  }
  if (coverage >= 70) {
    return 'yellowgreen'
  }
  if (coverage >= 60) {
    return 'yellow'
  }
  if (coverage >= 50) {
    return 'orange'
  }
  return 'red'
}

/**
 * Update README with coverage badge
 */
function updateReadmeWithBadge(badgeUrl: string): void {
  if (!fs.existsSync(README_FILE)) {
    return
  }

  let readme = fs.readFileSync(README_FILE, 'utf8')
  const newBadge = `![Coverage](${badgeUrl})`

  if (BADGE_REGEX.test(readme)) {
    readme = readme.replace(BADGE_REGEX, newBadge)
  } else if (FIRST_HEADING_REGEX.test(readme)) {
    readme = readme.replace(FIRST_HEADING_REGEX, (match) => `${match}\n\n${newBadge}`)
  } else {
    readme = `${newBadge}\n\n${readme}`
  }

  fs.writeFileSync(README_FILE, readme)
}

/**
 * Generates a coverage badge for the README based on the coverage report
 */
function generateCoverageBadge(): void {
  try {
    if (!fs.existsSync(COVERAGE_FILE)) {
      process.exit(1)
    }

    // Read coverage data
    const rawData = fs.readFileSync(COVERAGE_FILE, 'utf8')

    // Validate with valibot directly from JSON string
    const result = safeParse(CoverageSchema, JSON.parse(rawData))

    if (!result.success) {
      throw new Error('Invalid coverage data format')
    }

    const coverageData = result.output

    // Calculate coverage percentage
    const coverage = calculateCoverage(coverageData)

    // Generate badge URL
    const color = getBadgeColor(coverage)
    const badgeUrl = `https://img.shields.io/badge/coverage-${coverage}%25-${color}`

    // Update README with badge
    updateReadmeWithBadge(badgeUrl)
  } catch {
    // Error handling - silently exit with error code
    process.exit(1)
  }
}

generateCoverageBadge()
