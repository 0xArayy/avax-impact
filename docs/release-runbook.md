# Release runbook

1. Ensure `CHANGELOG.md` describes public changes and package versions are consistent.
2. Run `npm ci`, `npm --prefix demo ci`, `npm run check`, `npm run verify:fuji:all`, and
   `npm run verify:compatibility`.
3. Review `npm pack --workspace @avax-impact/sdk --dry-run` for unexpected files.
4. Merge through a reviewed pull request with green CI.
5. Create and push an annotated semantic-version tag. The tag-triggered workflow runs
   the full gate, installs the tarball in a clean consumer, and creates an immutable
   GitHub release artifact.
6. Publish to npm only after the release artifact is verified and npm publisher access
   is configured. Record the package URL and integrity in the release notes.

The historical Fuji deployment source commit
`0c0665124ed8f1edc5372ed48c77a92a941d08be` is preserved by the durable annotated tag
`fuji-schema0-v0.1.0`. `npm run verify:fuji` fails if the local tag resolves elsewhere.
The publication command used was:

```bash
git tag -a fuji-schema0-v0.1.0 0c0665124ed8f1edc5372ed48c77a92a941d08be \
  -m "Preserve source for the historical Fuji schema 0 deployment"
git push origin fuji-schema0-v0.1.0
```

The tag was published on 2026-08-28. Future deployment tags remain an explicit release
operation and are never created by local verification scripts.

The tag-triggered release job uses `npm run verify:deployment-sources` so publication
depends only on immutable git/source/build evidence. Live Fuji and external-contract
probes run before tagging and in scheduled CI; public RPC availability is not allowed to
make artifact creation nondeterministic.

The current schema 1 deployment is independently pinned by `fuji-schema1-v0.1.0` and
verified with `npm run verify:fuji:schema1`. Semantic release tags such as `v0.1.0`
identify distributable repository releases; deployment tags identify exact onchain
source. Neither tag type is moved after publication.
