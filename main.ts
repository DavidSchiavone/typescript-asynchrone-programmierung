import fetch, {Response} from "node-fetch";
import {map, mergeMap} from "rxjs/operators";
import {get} from "./utils";
import {forkJoin} from "rxjs";

/* 
Read data from https://swapi.dev/api/people/1 (Luke Skywalker)
and dependent data from swapi to return the following object

{
    name: 'Luke Skywalker',
    height: 172,
    gender: 'male',
    homeworld: 'Tatooine',
    films: [
        {
            title: 'A New Hope',
            director: 'George Lucas',
            release_date: '1977-05-25'
        },
        ... // and all other films
    ]
}

Define an interface of the result type above and all other types as well.

*/

interface Film {
  title: string;
  director: string;
  release_date: string;
}

interface Person {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: string[];
}

export interface PersonInfo {
  name: string;
  height: string;
  gender: "male" | "female" | "divers";
  homeworld: string;
  films: Film[];
}

// Task 1: write a function using promise based fetch api
type PromiseBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfo: PromiseBasedFunction = () => {
  return fetch("https://swapi.dev/api/people/1").then((response: Response) => {
    return response.json().then((person: Person) => {
      const homeworldPromise = fetch(person.homeworld).then( resp => resp.json());

      const filmPromises = Promise.all(person.films.map((filmUrl) =>
          fetch(filmUrl).then((response) => response.json())
      ));

      return Promise.all([homeworldPromise, filmPromises]).then(([homeworld, films]) =>{
        return {
        name: person.name,
        height: person.height,
        gender: person.gender,
        homeworld: homeworld.name,
        films: films.map((film) => ({
          title: film.title,
          director: film.director,
          release_date: film.release_date,
        })),
      };
    });
    });
  });
};

// Task 2: write a function using async and await
// see also: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-1-7.html
type AsyncBasedFunction = () => Promise<PersonInfo>;
export const getLukeSkywalkerInfoAsync: PromiseBasedFunction = async () => {
  const response = await fetch("https://swapi.dev/api/people/1");
  const person: Person = await response.json();

  const homeworldResponse = await fetch(person.homeworld);
  const homeworldData = await homeworldResponse.json();

  const filmPromises = person.films.map((filmUrl) =>
      fetch(filmUrl).then((response) => response.json())
  );
  const films = await Promise.all(filmPromises);

  return {
    name: person.name,
    height: person.height,
    gender: person.gender,
    homeworld: homeworldData.name,
    films: films.map((film) => ({
      title: film.title,
      director: film.director,
      release_date: film.release_date,
    })),
  };
};

// Task 3: write a function using Observable based api
// see also: https://rxjs.dev/api/index/function/forkJoin
export const getLukeSkywalkerInfoObservable = () => {
  return get<Person>("https://swapi.dev/api/people/1").pipe(
      mergeMap((person: Person) => {
        const homeworld$ = get<{ name: string }>(person.homeworld);
        const films$ = forkJoin(
            person.films.map((filmUrl) => get<{ title: string; director: string; release_date: string }>(filmUrl))
        );

        return forkJoin({ homeworld: homeworld$, films: films$ }).pipe(
            map(({ homeworld, films }) => ({
              name: person.name,
              height: person.height,
              gender: person.gender,
              homeworld: homeworld.name,
              films: films.map((film) => ({
                title: film.title,
                director: film.director,
                release_date: film.release_date,
              })),
            }))
        );
      })
  );
};