import { inject, Injectable, signal } from '@angular/core';

import { Place } from './place.model';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, catchError, throwError, tap } from 'rxjs';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private errorService = inject(ErrorService);
  private userPlaces = signal<Place[]>([]);
  private httpClient = inject(HttpClient);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces('http://localhost:3000/places', 'An error occurred!');
  }

  loadUserPlaces() {
    return this.fetchPlaces('http://localhost:3000/user-places', 'An error 2 occurred!')
      .pipe(tap((userPlaces?: Place[]) => this.userPlaces.set(userPlaces || [])));
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    if (!prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }

    this.userPlaces.update((places) => [...places, place]);

    return this.httpClient.put('http://localhost:3000/user-places', {
      placeId: place.id
    }).pipe(
      catchError((error) => {
        this.userPlaces.set(prevPlaces);
        this.errorService.showError('An error occurred!');
        return throwError(() => new Error('An error occurred!'))
      }));
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.update((places) => places.filter((p) => p.id !== place.id));
    }

    return this.httpClient.delete(`http://localhost:3000/user-places/${place.id}`).pipe(
      catchError((error) => {
        this.userPlaces.set(prevPlaces);
        this.errorService.showError('An error occurred!');
        return throwError(() => new Error('An error occurred!'))
      }));
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient.get<{ places: Place[] }>(url, {
      observe: 'response', // return all response object
      // observe: 'events' // return events: request was sent, response was received, etc.
    }).pipe(
      map((response: HttpResponse<{ places: Place[] }>) => {
        return response.body?.places;
      }),
      catchError((error) => {
        console.log(error.message);
        return throwError(() => new Error('An error occurred!'));
      }))
  }
}
