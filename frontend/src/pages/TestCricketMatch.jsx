import React, { useEffect, useState } from 'react';

const TestCricketMatch = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/sports/cricket/matches')
      .then((res) => res.json())
      .then((data) => {
        setMatches(data.matches || data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;


  // List of major ICC events and T20 leagues
  const majorLeagues = [
    'ICC Cricket World Cup',
    'ICC T20 World Cup',
    'ICC Champions Trophy',
    'ICC World Test Championship',
    'Indian Premier League',
    'Big Bash League',
    'Pakistan Super League',
    'Caribbean Premier League',
    'The Ashes',
    'Asia Cup',
    'Bangladesh Premier League',
    'SA20',
    'Lanka Premier League',
    'Vitality Blast',
    'Mzansi Super League',
    'Global T20 Canada',
    'Abu Dhabi T10',
    'The Hundred',
    'Super Smash',
    'Zimbabwe Domestic T20',
    'Afghanistan Premier League',
    'Euro T20 Slam',
    "Women's Big Bash League",
    "Women's T20 Challenge",
    "Women's Cricket World Cup",
    "Women's T20 World Cup",
    // Add more as needed
  ];

  // Filter for major leagues only
  const majorMatches = matches.filter(
    (match) => majorLeagues.some(
      (league) => (match.strLeague || match.league || '').toLowerCase().includes(league.toLowerCase())
    )
  );

  // Filter for ongoing India vs England match in major leagues
  const ongoingMatch = majorMatches.find(
    (match) => {
      const teams = [
        (match.team1 || match.strHomeTeam || '').toLowerCase(),
        (match.team2 || match.strAwayTeam || '').toLowerCase()
      ];
      return (
        teams.includes('india') &&
        teams.includes('england') &&
        (match.status?.toLowerCase().includes('live') || match.status?.toLowerCase().includes('ongoing') || match.strStatus?.toLowerCase().includes('live') || match.strStatus?.toLowerCase().includes('ongoing'))
      );
    }
  );

  return (
    <div style={{ padding: 24 }}>
      <h2>Test: Ongoing India vs England Cricket Match (Major Leagues Only)</h2>
      {ongoingMatch ? (
        <pre style={{ background: '#eee', padding: 16, borderRadius: 8 }}>
          {JSON.stringify(ongoingMatch, null, 2)}
        </pre>
      ) : (
        <div>No ongoing India vs England match found in major leagues.</div>
      )}
      <h3>Major League Cricket Matches</h3>
      <pre style={{ background: '#f9f9f9', padding: 16, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}>
        {JSON.stringify(majorMatches, null, 2)}
      </pre>
    </div>
  );
};

export default TestCricketMatch;
