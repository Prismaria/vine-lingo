import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const termId = searchParams.get('term');

    // If no term ID, return default site OG image
    if (!termId) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0f172a',
              padding: '40px',
              fontFamily: 'sans-serif',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#1e293b',
                borderRadius: '24px',
                padding: '60px',
                width: '1000px',
                border: '1px solid #334155',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '30px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '16px',
                    backgroundColor: '#09BE82',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '48px',
                    fontWeight: 'bold',
                    marginRight: '20px',
                  }}
                >
                  V
                </div>
                <div style={{ color: '#94a3b8', fontSize: '24px', fontWeight: '600', letterSpacing: '0.1em' }}>
                  VINE LINGO DICTIONARY
                </div>
              </div>

              <div style={{ color: 'white', fontSize: '72px', fontWeight: '800', marginBottom: '30px' }}>
                Vine Lingo
              </div>

              <div
                style={{
                  color: '#cbd5e1',
                  fontSize: '36px',
                  lineHeight: '1.5',
                  maxWidth: '900px',
                }}
              >
                The Unofficial Vine Dictionary
              </div>

              <div
                style={{
                  marginTop: '40px',
                  padding: '20px 40px',
                  backgroundColor: '#0f172a',
                  borderRadius: '12px',
                  border: '2px solid #09BE82',
                  color: '#09BE82',
                  fontSize: '20px',
                  fontWeight: '600',
                }}
              >
                A quick-reference guide for Amazon Vine Voices
              </div>
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Fetch term data from Supabase directly in the Edge Function
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/terms?id=eq.${termId}&select=*`,
      {
        headers: {
          apikey: supabaseKey!,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    const data = await response.json();
    const term = data[0];

    if (!term) {
      return new Response('Term not found', { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a',
            padding: '40px',
            fontFamily: 'sans-serif',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1e293b',
              borderRadius: '24px',
              padding: '60px',
              width: '1000px',
              border: '1px solid #334155',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '12px',
                  backgroundColor: '#09BE82',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  marginRight: '20px',
                }}
              >
                V
              </div>
              <div style={{ color: '#94a3b8', fontSize: '20px', fontWeight: '600', letterSpacing: '0.1em' }}>
                VINE LINGO DICTIONARY
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                <div
                  style={{
                    backgroundColor: '#0f172a',
                    color: '#09BE82',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    marginRight: '15px',
                    border: '1px solid #09BE82',
                  }}
                >
                  {term.category}
                </div>
                <div style={{ color: 'white', fontSize: '64px', fontWeight: '800' }}>
                  {term.term}
                </div>
              </div>

              <div
                style={{
                  color: '#cbd5e1',
                  fontSize: '32px',
                  lineHeight: '1.4',
                  marginTop: '20px',
                }}
              >
                {term.definition}
              </div>

              {term.example && (
                <div
                  style={{
                    marginTop: '30px',
                    padding: '20px',
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    borderLeft: '4px solid #09BE82',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ color: '#64748b', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' }}>
                    Example Usage
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '24px', fontStyle: 'italic' }}>
                    "{term.example}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.log(`${e.message}`);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
