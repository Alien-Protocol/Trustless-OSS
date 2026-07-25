# Trustless OSS bot commands

Trustless OSS commands are written as comments on the relevant GitHub bounty issue. Mention `@Trustless-OSS` first, followed by the command or custom reward amount.

## Bounty labels

Before using a command, the maintainer enables the bounty with these issue labels:

| Label      | Purpose                                             |
| ---------- | --------------------------------------------------- |
| `rewarded` | Marks the issue as bounty-enabled                   |
| `low`      | Uses the repository's configured low reward         |
| `medium`   | Uses the repository's configured medium reward      |
| `high`     | Uses the repository's configured high reward        |
| `custom`   | Allows the maintainer to enter a custom USDC reward |

Use `rewarded` together with one reward label.

### Set a custom bounty amount

After adding `rewarded` and `custom`, the maintainer comments with the desired USDC amount:

```text
@Trustless-OSS 150
```

This example sets the issue reward to 150 USDC.

## Maintainer commands

These commands control payout percentages, rejection, disputes, and retries.

| Command                                        | Purpose                                                       |
| ---------------------------------------------- | ------------------------------------------------------------- |
| `@Trustless-OSS /pay <percentage>`             | Save the contributor's partial payout percentage before merge |
| `@Trustless-OSS /split <percentage>`           | Alias for `/pay`                                              |
| `@Trustless-OSS /work <percentage>`            | Alias for `/pay`                                              |
| `@Trustless-OSS /work-completion <percentage>` | Save a work-completion percentage for a split payout          |
| `@Trustless-OSS /reject`                       | Reject the submitted work and begin the dispute/refund flow   |
| `@Trustless-OSS /rejected`                     | Alias for `/reject`                                           |
| `@Trustless-OSS /no`                           | Alias for `/reject`                                           |
| `@Trustless-OSS /retry`                        | Retry a failed payout or release transaction                  |

### Partial payout example

```text
@Trustless-OSS /pay 75
```

This records a 75% contributor payout for the issue.

### Reject work example

```text
@Trustless-OSS /reject
```

## Contributor commands

These commands help the assigned contributor connect or change their payout wallet.

| Command                          | Purpose                                        |
| -------------------------------- | ---------------------------------------------- |
| `@Trustless-OSS /wallet`         | Request the contributor wallet connection link |
| `@Trustless-OSS /address`        | Alias for `/wallet`                            |
| `@Trustless-OSS /connect`        | Alias for `/wallet`                            |
| `@Trustless-OSS /change-address` | Request a new wallet connection link           |

### Wallet connection example

```text
@Trustless-OSS /wallet
```

## General command

Anyone who needs command guidance can request the help message:

```text
@Trustless-OSS /help
```

## Pull-request linking

For automatic payout processing, the contributor's pull-request description must reference the bounty issue with a supported closing keyword:

```text
Closes #123
```

`Fixes #123` and `Resolves #123` are also supported. Replace `123` with the actual bounty issue number.

## Usage notes

- Write commands on the relevant bounty issue, not on an unrelated issue or pull request.
- Keep the `@Trustless-OSS` mention and command in the same comment.
- Maintainer commands are intended for repository maintainers.
- Wallet commands are intended for the contributor assigned to the bounty.
- Use `/help` if you need the bot to display the available commands in GitHub.
