export default interface IExplorePlace {
    id: string;
    name: string;
    description?: string;
    type?: string;
    address?: string;
    latitude: number;
    longitude: number;
    rating?: number;
    reviews?: number;
    price?: string;
    image?: string;
    link?: string;
  }