// Real-game puzzles: positions from the top-100 classic games, with
// attribution. Every position passes Board.validate(), every solution is the
// engine's best move at depth 4 AND winning, and every attribution is verified
// by replaying the source game to the puzzle ply (see real-puzzles.test.js).
// Generated from a scan of all 100 classics: mate-in-1s the masters actually
// played, plus captures that swung the static eval by >200cp from a
// non-crushing position. One puzzle per game, mates first.
export const REAL_PUZZLES = [
  {
    "id": 101,
    "motif": "Mate",
    "fen": "r1bk3r/p2p1pNp/n2B1n2/1p1NP2P/6P1/3P4/P1P1K3/q5b1 w - - 0 23",
    "solution": [
      "d6e7"
    ],
    "title": "Anderssen vs Kieseritzky, move 23",
    "lesson": "Be7# is mate — Anderssen vs Kieseritzky, Casual game 1851.",
    "source": {
      "game": 1,
      "white": "Adolf Anderssen",
      "black": "Lionel Adalbert Bagration Felix Kieseritzky",
      "event": "Casual game",
      "site": "London ENG",
      "date": "1851.06.21",
      "moveNo": 23,
      "ply": 44
    }
  },
  {
    "id": 102,
    "motif": "Back-rank mate",
    "fen": "1n2kb1r/p4ppp/4q3/4p1B1/4P3/8/PPP2PPP/2KR4 w k - 0 17",
    "solution": [
      "d1d8"
    ],
    "title": "Morphy vs Duke Karl / Count Isouard, move 17",
    "lesson": "Rd8# is mate — Morphy vs Duke Karl / Count Isouard, Paris 1858.",
    "source": {
      "game": 3,
      "white": "Paul Morphy",
      "black": "Duke Karl / Count Isouard",
      "event": "Paris",
      "site": "Paris FRA",
      "date": "1858.??.??",
      "moveNo": 17,
      "ply": 32
    }
  },
  {
    "id": 103,
    "motif": "Mate",
    "fen": "4r1k1/p2K3p/6p1/2pP4/4P3/1PQ5/PB5q/2R2b2 b - - 6 32",
    "solution": [
      "f1b5"
    ],
    "title": "Nimzowitsch vs Tarrasch, move 32",
    "lesson": "Bb5# is mate — Nimzowitsch vs Tarrasch, St. Petersburg 1914.",
    "source": {
      "game": 14,
      "white": "Aron Nimzowitsch",
      "black": "Siegbert Tarrasch",
      "event": "St. Petersburg",
      "site": "St. Petersburg  RUE",
      "date": "1914.04.28",
      "moveNo": 32,
      "ply": 63
    }
  },
  {
    "id": 104,
    "motif": "Mate",
    "fen": "1Q6/5pk1/2p3p1/1p2N2p/1b5P/1bn5/r5P1/2K5 b - - 15 41",
    "solution": [
      "a2c2"
    ],
    "title": "Byrne vs Fischer, move 41",
    "lesson": "Rc2# is mate — Byrne vs Fischer, Third Rosenwald Trophy 1956.",
    "source": {
      "game": 39,
      "white": "Donald Byrne",
      "black": "Robert James Fischer",
      "event": "Third Rosenwald Trophy",
      "site": "New York, NY USA",
      "date": "1956.10.17",
      "moveNo": 41,
      "ply": 81
    }
  },
  {
    "id": 105,
    "motif": "Tactic",
    "fen": "4rr1k/1b2b1pp/7q/p1P1pp2/B1QpN3/5P2/PP4PP/2RR2K1 w - - 4 23",
    "solution": [
      "a4e8"
    ],
    "title": "McDonnell vs Bourdonnais, move 23",
    "lesson": "Bxe8 wins the rook — McDonnell vs Bourdonnais, La Bourdonnais - McDonnell 4th Casual Match 1834.",
    "source": {
      "game": 0,
      "white": "Alexander McDonnell",
      "black": "Louis Charles Mahe De La Bourdonnais",
      "event": "La Bourdonnais - McDonnell 4th Casual Match",
      "site": "London ENG",
      "date": "1834.??.??",
      "moveNo": 23,
      "ply": 44
    }
  },
  {
    "id": 106,
    "motif": "Tactic",
    "fen": "1r2k1r1/pbppnp1p/1bn2P2/7q/Q7/B1PB1N2/P4PPP/3RR1K1 b - - 2 19",
    "solution": [
      "h5f3"
    ],
    "title": "Anderssen vs Dufresne, move 19",
    "lesson": "Qxf3 wins the knight — Anderssen vs Dufresne, Casual Game 1852.",
    "source": {
      "game": 2,
      "white": "Adolf Anderssen",
      "black": "Jean Dufresne",
      "event": "Casual Game",
      "site": "Berlin GER (Kingdom of Prussia)",
      "date": "1852.??.??",
      "moveNo": 19,
      "ply": 37
    }
  },
  {
    "id": 107,
    "motif": "Tactic",
    "fen": "6k1/pb2q1B1/1p6/2rP4/4Q3/1P2R3/P1r3PP/6K1 w - - 2 33",
    "solution": [
      "e4e7"
    ],
    "title": "Zukertort vs Blackburne, move 33",
    "lesson": "Qxe7 wins the queen — Zukertort vs Blackburne, London 1883.",
    "source": {
      "game": 4,
      "white": "Johannes Zukertort",
      "black": "Joseph Henry Blackburne",
      "event": "London",
      "site": "London ENG",
      "date": "1883.05.05",
      "moveNo": 33,
      "ply": 64
    }
  },
  {
    "id": 108,
    "motif": "Tactic",
    "fen": "4rr2/1ppb4/2q3pB/p3k3/3n3Q/1BP5/PP3PP1/2K5 w - - 6 28",
    "solution": [
      "h4d4"
    ],
    "title": "Steinitz vs Chigorin, move 28",
    "lesson": "Qxd4+ wins the knight — Steinitz vs Chigorin, Steinitz - Chigorin World Championship Rematch 1892.",
    "source": {
      "game": 5,
      "white": "Wilhelm Steinitz",
      "black": "Mikhail Chigorin",
      "event": "Steinitz - Chigorin World Championship Rematch",
      "site": "Havana CUB",
      "date": "1892.01.07",
      "moveNo": 28,
      "ply": 54
    }
  },
  {
    "id": 109,
    "motif": "Tactic",
    "fen": "5rk1/pp3pp1/4Pb1p/q2p3Q/3P4/r7/PP4PP/1K1R1B1R w - - 1 19",
    "solution": [
      "e6f7"
    ],
    "title": "Pillsbury vs Lasker, move 19",
    "lesson": "exf7+ wins the pawn — Pillsbury vs Lasker, St. Petersburg Quadrangular 1895/96 1896.",
    "source": {
      "game": 7,
      "white": "Harry Nelson Pillsbury",
      "black": "Emanuel Lasker",
      "event": "St. Petersburg Quadrangular 1895/96",
      "site": "St. Petersburg RUE",
      "date": "1896.01.04",
      "moveNo": 19,
      "ply": 36
    }
  },
  {
    "id": 110,
    "motif": "Tactic",
    "fen": "r1b2r1k/ppp1q1pp/2n1pb2/2P5/2BPQp2/P3PPB1/1P4PP/2KR2NR b - - 0 14",
    "solution": [
      "f4g3"
    ],
    "title": "Steinitz vs Lasker, move 14",
    "lesson": "fxg3 wins the bishop — Steinitz vs Lasker, St. Petersburg Quadrangular 1895/96 1896.",
    "source": {
      "game": 8,
      "white": "Wilhelm Steinitz",
      "black": "Emanuel Lasker",
      "event": "St. Petersburg Quadrangular 1895/96",
      "site": "St. Petersburg RUE",
      "date": "1896.01.08",
      "moveNo": 14,
      "ply": 27
    }
  },
  {
    "id": 111,
    "motif": "Tactic",
    "fen": "r2qk2r/1p1bbp2/1P2p3/p2pPp2/R2N1N1p/3PB3/5QPP/5RK1 b kq - 0 24",
    "solution": [
      "d7a4"
    ],
    "title": "Pillsbury vs Lasker, move 24",
    "lesson": "Bxa4 wins the rook — Pillsbury vs Lasker, Nuremberg 1896.",
    "source": {
      "game": 9,
      "white": "Harry Nelson Pillsbury",
      "black": "Emanuel Lasker",
      "event": "Nuremberg",
      "site": "Nuremberg GER",
      "date": "1896.07.29",
      "moveNo": 24,
      "ply": 47
    }
  },
  {
    "id": 112,
    "motif": "Tactic",
    "fen": "r1bq1rk1/ppn2pbp/6p1/3Pp1P1/3n1P1P/2N1B3/PPP1N3/R2QKB1R w KQ - 1 14",
    "solution": [
      "e2d4"
    ],
    "title": "Lasker vs Napier, move 14",
    "lesson": "Nxd4 wins the knight — Lasker vs Napier, Cambridge Springs 1904.",
    "source": {
      "game": 10,
      "white": "Emanuel Lasker",
      "black": "William Ewart Napier",
      "event": "Cambridge Springs",
      "site": "Cambridge Springs, PA USA",
      "date": "1904.04.28",
      "moveNo": 14,
      "ply": 26
    }
  },
  {
    "id": 113,
    "motif": "Tactic",
    "fen": "r3k2r/pp1b1ppp/2n5/1B1N2q1/3P4/8/PP3PPP/R2QK2R w KQkq - 1 13",
    "solution": [
      "b5c6"
    ],
    "title": "Rubinstein vs Lasker, move 13",
    "lesson": "Bxc6 wins the knight — Rubinstein vs Lasker, St. Petersburg 1909.",
    "source": {
      "game": 12,
      "white": "Akiba Rubinstein",
      "black": "Emanuel Lasker",
      "event": "St. Petersburg",
      "site": "St. Petersburg RUE",
      "date": "1909.02.18",
      "moveNo": 13,
      "ply": 24
    }
  },
  {
    "id": 114,
    "motif": "Tactic",
    "fen": "r1bq1rk1/2p1bppp/p7/1p1nn3/8/1BP5/PP1P1PPP/RNBQR1K1 w - - 0 11",
    "solution": [
      "e1e5"
    ],
    "title": "Capablanca vs Marshall, move 11",
    "lesson": "Rxe5 wins the knight — Capablanca vs Marshall, New York 1918.",
    "source": {
      "game": 15,
      "white": "Jose Raul Capablanca",
      "black": "Frank James Marshall",
      "event": "New York",
      "site": "New York, NY USA",
      "date": "1918.10.23",
      "moveNo": 11,
      "ply": 20
    }
  },
  {
    "id": 115,
    "motif": "Tactic",
    "fen": "r5k1/pp1b3p/2p1p3/3p3n/2PPp1pq/PPB1P1b1/3Q1R2/1N1R1BK1 b - - 9 25",
    "solution": [
      "g3f2"
    ],
    "title": "Maroczy vs Tartakower, move 25",
    "lesson": "Bxf2+ wins the rook — Maroczy vs Tartakower, Teplitz-Schoenau 1922.",
    "source": {
      "game": 18,
      "white": "Geza Maroczy",
      "black": "Savielly Tartakower",
      "event": "Teplitz-Schoenau",
      "site": "Teplice-Sanov CSR",
      "date": "1922.10.05",
      "moveNo": 25,
      "ply": 49
    }
  },
  {
    "id": 116,
    "motif": "Tactic",
    "fen": "6k1/5pb1/p5pp/1p6/2QrPP2/P7/NP4PP/3R2K1 b - - 0 33",
    "solution": [
      "d4d1"
    ],
    "title": "Gruenfeld vs Alekhine, move 33",
    "lesson": "Rxd1+ wins the rook — Gruenfeld vs Alekhine, Karlsbad 1923.",
    "source": {
      "game": 20,
      "white": "Ernst Gruenfeld",
      "black": "Alexander Alekhine",
      "event": "Karlsbad",
      "site": "Karlsbad CSR",
      "date": "1923.04.29",
      "moveNo": 33,
      "ply": 65
    }
  },
  {
    "id": 117,
    "motif": "Tactic",
    "fen": "r5k1/1Qq2pp1/5n2/2N5/6b1/2n1rNP1/3RPP2/2R3KB b - - 0 29",
    "solution": [
      "c7b7"
    ],
    "title": "Reti vs Alekhine, move 29",
    "lesson": "Qxb7 wins the queen — Reti vs Alekhine, Baden-Baden 1925.",
    "source": {
      "game": 23,
      "white": "Richard Reti",
      "black": "Alexander Alekhine",
      "event": "Baden-Baden",
      "site": "Baden-Baden GER",
      "date": "1925.04.25",
      "moveNo": 29,
      "ply": 57
    }
  },
  {
    "id": 118,
    "motif": "Tactic",
    "fen": "3q1rk1/pB3ppp/4p3/2b5/2Pp4/P1B3P1/3NPK1P/3Q1R2 b - - 0 19",
    "solution": [
      "d4c3"
    ],
    "title": "Rubinstein vs Alekhine, move 19",
    "lesson": "dxc3+ wins the bishop — Rubinstein vs Alekhine, Semmering 1926.",
    "source": {
      "game": 25,
      "white": "Akiba Rubinstein",
      "black": "Alexander Alekhine",
      "event": "Semmering",
      "site": "Semmering AUT",
      "date": "1926.03.17",
      "moveNo": 19,
      "ply": 37
    }
  },
  {
    "id": 119,
    "motif": "Tactic",
    "fen": "6rk/5prq/1p1p1n2/p1pP1B1p/P1P2P1n/2P1R1P1/2Q4K/2B2NR1 b - - 0 35",
    "solution": [
      "h4f5"
    ],
    "title": "Johner vs Nimzowitsch, move 35",
    "lesson": "Nxf5 wins the bishop — Johner vs Nimzowitsch, Dresden 1926.",
    "source": {
      "game": 26,
      "white": "Paul F Johner",
      "black": "Aron Nimzowitsch",
      "event": "Dresden",
      "site": "Dresden GER",
      "date": "1926.04.05",
      "moveNo": 35,
      "ply": 69
    }
  },
  {
    "id": 120,
    "motif": "Tactic",
    "fen": "r1b2rk1/3n1ppp/p3q3/Qp1p2B1/2pPn3/2P1P3/P1BN1PPP/R3R1K1 w - - 2 16",
    "solution": [
      "d2e4"
    ],
    "title": "Capablanca vs Spielmann, move 16",
    "lesson": "Nxe4 wins the knight — Capablanca vs Spielmann, New York 1927.",
    "source": {
      "game": 27,
      "white": "Jose Raul Capablanca",
      "black": "Rudolf Spielmann",
      "event": "New York",
      "site": "New York, NY USA",
      "date": "1927.03.09",
      "moveNo": 16,
      "ply": 30
    }
  },
  {
    "id": 121,
    "motif": "Tactic",
    "fen": "4b2Q/1p1nkp1N/p2rp2p/5P2/Pq1r4/3B4/6PP/2R2RK1 b - - 3 27",
    "solution": [
      "d4d3"
    ],
    "title": "Alekhine vs Maroczy, move 27",
    "lesson": "Rxd3 wins the bishop — Alekhine vs Maroczy, Bled 1931.",
    "source": {
      "game": 28,
      "white": "Alexander Alekhine",
      "black": "Geza Maroczy",
      "event": "Bled",
      "site": "Bled YUG",
      "date": "1931.09.24",
      "moveNo": 27,
      "ply": 53
    }
  },
  {
    "id": 122,
    "motif": "Tactic",
    "fen": "8/p3q1kp/1p2Pnp1/3pQ3/2pP4/BnP3N1/6PP/6K1 b - - 6 30",
    "solution": [
      "e7a3"
    ],
    "title": "Botvinnik vs Capablanca, move 30",
    "lesson": "Qxa3 wins the bishop — Botvinnik vs Capablanca, AVRO 1938.",
    "source": {
      "game": 30,
      "white": "Mikhail Botvinnik",
      "black": "Jose Raul Capablanca",
      "event": "AVRO",
      "site": "The Netherlands",
      "date": "1938.11.22",
      "moveNo": 30,
      "ply": 59
    }
  },
  {
    "id": 123,
    "motif": "Tactic",
    "fen": "r2qr2k/pbp3pp/1p1pBb2/2Bp4/2P5/6P1/PP2QP1P/3RNRK1 b - - 3 20",
    "solution": [
      "d6c5"
    ],
    "title": "Euwe vs Keres, move 20",
    "lesson": "dxc5 wins the bishop — Euwe vs Keres, Euwe - Keres 1939/40.",
    "source": {
      "game": 31,
      "white": "Max Euwe",
      "black": "Paul Keres",
      "event": "Euwe - Keres 1939/40",
      "site": "Rotterdam NED",
      "date": "1940.01.05",
      "moveNo": 20,
      "ply": 39
    }
  },
  {
    "id": 124,
    "motif": "Tactic",
    "fen": "5rnk/1p5p/3p3r/p1p1p1b1/2P1PpK1/5P2/PP1QNB2/5R2 w - - 0 44",
    "solution": [
      "g4g5"
    ],
    "title": "Averbakh vs Kotov, move 44",
    "lesson": "Kxg5 wins the bishop — Averbakh vs Kotov, Zurich Candidates 1953.",
    "source": {
      "game": 34,
      "white": "Yuri Averbakh",
      "black": "Alexander Kotov",
      "event": "Zurich Candidates",
      "site": "Zuerich SUI",
      "date": "1953.09.23",
      "moveNo": 44,
      "ply": 86
    }
  }
];
