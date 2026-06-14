export type TravelpayoutsFlight = {
    origin: string;
    destination: string;
    origin_airport?: string;
    destination_airport?: string;
    price?: number;
    value?: number;
    airline?: string;
    flight_number?: string;
    departure_at?: string;
    return_at?: string;
    depart_date?: string;
    return_date?: string;
    transfers?: number;
    duration?: number;
    link?: string;
  };
  
  export async function fetchTravelpayoutsFlights(params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
  }) {
   
  
    const url = new URL('http://localhost:3001/api/flights');
  
    url.searchParams.set('origin', params.origin);
    url.searchParams.set('destination', params.destination);
    url.searchParams.set('beginning_of_period', params.departureDate.slice(0, 7) + '-01');
url.searchParams.set('period_type', 'month');
    url.searchParams.set('currency', 'eur');
    url.searchParams.set('market', 'pt');
    url.searchParams.set('sorting', 'price');
    url.searchParams.set('limit', '10');
    
  
    if (params.returnDate) {
      url.searchParams.set('return_at', params.returnDate);
      url.searchParams.set('one_way', 'false');
    } else {
      url.searchParams.set('one_way', 'true');
    }
  
    const response = await fetch(url.toString());
  
    if (!response.ok) {
      throw new Error('Travelpayouts API request failed');
    }
  
    return response.json();
  }