// Six guided positional lessons. ESM — shared by tests and the browser app.
// Each lesson: title, intro, cards (2-4) with FEN + text; the last card is an
// exercise with one or more engine-approved solution moves (UCI).

export const LESSONS = [
  {
    id: 'iqp', title: 'The Isolated Queen’s Pawn',
    intro: 'A pawn with no neighbors is strong in attack — and a target in defense. Learn both sides.',
    cards: [
      { fen: 'r1bqkbnr/ppp2ppp/2n5/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 1',
        text: 'White has just played d4. The d4 pawn has no pawn neighbors — it is an isolated queen’s pawn (IQP). It controls e5 and c5, giving White space and attacking chances.' },
      { fen: 'r1bqk2r/ppp2ppp/2n2n2/3p4/3PP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 1',
        text: 'Black’s plan: blockade the pawn with a knight (…Nf6–d5), then pile up attackers. A blockaded IQP cannot advance and becomes a permanent weakness.' },
      { fen: 'r1bq1rk1/ppp2ppp/2n2n2/3p4/3PP3/2N2N2/PPPQ1PPP/R1BQKB1R w - - 0 1',
        text: 'White’s plan: use the IQP’s energy before it gets blockaded — push d5 at the right moment, or use the e5 and c5 squares it supports for the pieces.' },
    ],
    exercise: {
      fen: 'r1bqk2r/ppp2ppp/2n2n2/8/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 1',
      prompt: 'You are Black. Centralize a knight — Nd5 blockades the isolated pawn, Ne4 hits c3.',
      solutions: ['f6d5', 'f6e4'],
      hint: 'A knight belongs in the center — d5 or e4.',
    },
  },
  {
    id: 'outpost', title: 'Outposts — Knights That Can’t Be Chased',
    intro: 'A knight on a strong square, defended by a pawn, where no enemy pawn can attack it — that’s an outpost.',
    cards: [
      { fen: 'r1bqkbnr/ppp2ppp/2n5/3p4/3P4/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 1',
        text: 'The d5 square is calling. If White plants a knight there, defended by the c4 pawn, Black has no pawn that can ever chase it away (…c6 weakens d6, …e6 weakens f6).' },
      { fen: 'r1bqkbnr/ppp2ppp/2n5/3N4/3P4/8/PPP2PPP/R1BQKBNR b KQkq - 0 1',
        text: 'There it is: Nd5. The knight eyes c7, e7, f6 and f4. Black must trade pieces or live with a permanent guest.' },
    ],
    exercise: {
      fen: 'r1bqkbnr/ppp2ppp/2n5/3p4/3P4/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 1',
      prompt: 'You are White. Plant the knight on the d5 outpost.',
      solutions: ['c3d5'],
      hint: 'The knight belongs on d5.',
      acceptNearBest: true,
    },
  },
  {
    id: 'open-files', title: 'Open Files and the Seventh Rank',
    intro: 'Rooks belong on open files. And a rook on the seventh rank is worth a pawn by itself.',
    cards: [
      { fen: '4k3/8/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        text: 'The e-file is open — no pawns on it. White’s rook already owns it, x-raying the black king.' },
      { fen: '4k3/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
        text: 'Now imagine the rook on e7: it would attack f7, g7 and h7, and trap the king. Getting a rook to the seventh is often decisive.' },
    ],
    exercise: {
      fen: '6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',
      prompt: 'You are White. Mate on the back rank.',
      solutions: ['e1e8'],
      hint: 'The rook belongs on the back rank — and it’s mate.',
    },
  },
  {
    id: 'bishop-pair', title: 'The Bishop Pair in Open Positions',
    intro: 'Two bishops control both colors. In open positions with play on both flanks, they dominate knights.',
    cards: [
      { fen: '4k3/8/8/8/8/8/5PPP/4K3 w - - 0 1',
        text: 'Open board, no locked pawn chains. This is bishop territory — long diagonals and targets on both wings.' },
      { fen: '2b1k3/8/8/8/8/8/5PPP/2B1K3 w - - 0 1',
        text: 'Keep the position open, avoid trading a bishop for a knight, and let the pair work. In endings, the bishop pair is often worth an extra pawn.' },
    ],
    exercise: {
      fen: '4k3/8/8/3n4/4B3/8/5PPP/4K3 w - - 0 1',
      prompt: 'You are White. Win the loose knight with the bishop.',
      solutions: ['e4d5'],
      hint: 'Just take the knight — Bxd5.',
    },
  },
  {
    id: 'king-safety', title: 'King Safety — Pawn Storms',
    intro: 'A castled king is safe behind pawns — until the pawns move. Learn when a storm is strong and when it’s suicide.',
    cards: [
      { fen: '6k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
        text: 'Black’s king sits behind f7/g7/h7. Those pawns are doing a job — every one that advances leaves a square weak.' },
      { fen: '6k1/5pp1/8/7P/8/8/5PPP/6K1 w - - 0 1',
        text: 'White has played h5, fixing h7. Now …g6 weakens f6 and h6; …h6 drops the pawn. Storms must be prepared — never push without backup.' },
    ],
    exercise: {
      fen: '6k1/5ppp/8/8/8/8/5PPP/3Q2K1 w - - 0 1',
      prompt: 'You are White. Punish the weakened kingside with mate in one.',
      solutions: ['d1d8'],
      hint: 'The back rank is weak — invade it.',
    },
  },
  {
    id: 'passed-pawns', title: 'Passed Pawns — Push Them',
    intro: 'A passed pawn (no enemy pawn can stop it) must be pushed. Babysitting it with pieces is how winning endings are drawn.',
    cards: [
      { fen: '4k3/8/8/3P4/8/8/5PPP/4K3 w - - 0 1',
        text: 'The d5 pawn is passed — no black pawn can ever capture or block it. Its destiny is d8.' },
      { fen: '4k3/8/8/3P4/8/8/5PPP/4K3 w - - 0 1',
        text: 'Push it! Every step forward ties Black’s pieces down. A passed pawn on the sixth is worth a piece.' },
    ],
    exercise: {
      fen: '8/3P1k2/8/8/8/8/8/4K3 w - - 0 1',
      prompt: 'You are White. Push the passed pawn and queen it.',
      solutions: ['d7d8q', 'd7d8r'],
      hint: 'Pawns move forward — queen the pawn.',
    },
  },
];
