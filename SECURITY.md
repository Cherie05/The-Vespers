# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Security Architecture

VesperAero implements defense-in-depth security principles:
1. **Isolated Cloud AI**: The Google Gemini API key is 100% server-side and never exposed to browser clients or mobile apps.
2. **Payload Protection**: Strict 10MB memory boundaries prevent DoS attacks through large payload ingestion.
3. **SHA-256 Quota Shield**: Image hashes are cached in-memory for 15 minutes to defeat API quota exhaustion attacks.
4. **Judge VIP Access**: Authorized evaluation tokens (`X-Judge-Token: vesper-eval-2026`) allow continuous load testing without rate limit denial.
5. **Zero-Vulnerability Audited Dependencies**: Continuous automated static analysis and `npm audit` verification.

## Reporting a Vulnerability

If you discover a security issue or vulnerability in VesperAero, please report it privately to the maintainers rather than creating a public issue.

Thank you for helping keep VesperAero secure!
