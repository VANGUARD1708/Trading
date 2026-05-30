// api-server/src/routes/search.ts

import { Router } from "express";
import { SYMBOLS } from "../services/symbol-registry.service";

const router = Router();

router.get("/search", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();

  const results = SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q)
  ).slice(0, 20);

  res.json(results);
});

export default router;