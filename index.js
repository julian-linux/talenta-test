const https = require('https')
const http = require('http')

const planetsRequested = {}
const actorsRequested = {}
const speciesRequested = {}
const starshipsRequested = {}

const requestApi = url => new Promise(resolve => {
  https.get(url, response => {
    let data = ''
    response.on('data', chunk => data += chunk);
    response.on('end', () => resolve(JSON.parse(data)));

  }).on("error", (err) => {
    console.log("Error: " + err.message);
  })

})

// request array of url in api and store result
const requestElement = async (element, storage, storeKeys) => new Promise((resolve) => {
  const requestedElements = []

  try {
     // get object data, if not exists in storage... request element data and store it
  const requestApiElement = async (idx = 0) => {
    if (typeof element[idx] === 'string') {
      if (!storage[element[idx]]) {
        console.info(`--requesting ${element[idx]}`)
        const data = await requestApi(element[idx].replace('http', 'https'))
        
        const storeData = storeKeys.reduce((prev, key) => ({ ...prev, [key]: data[key] }), {})
        storage[element[idx]] = storeData
        requestedElements.push(storeData)
        await requestApiElement(++idx)
      } else {
        requestedElements.push(storage[element[idx]])

        await requestApiElement(++idx)
      }
    } else {
      resolve(requestedElements)
    }
  }
  requestApiElement()
  } catch (error) {
    console.error('error ')
  }
 
})


const parseFilmsData = async data => {
  console.info('init parseFilms');
  const response = []
  const planetKeys = ['name', 'terrain', 'gravity', 'diameter', 'population']
  const actorKeys = ['name', 'gender', 'hair_color', 'skin_color', 'eye_color', 'height', 'homeworld', 'species']
  const specieKeys = ['name', 'language', 'average_height']
  const starshipKeys = ['name', 'model', 'manufacturer', 'passengers', 'length']

  for (const { title, planets: _planets, characters, starships: _starships } of data.results) {
    console.info(`-getting planets of -${title}-`);
    const planets = await requestElement(_planets, planetsRequested, planetKeys)

    console.info(`-getting actors of -${title}-`);
    const actors = await requestElement(characters, actorsRequested, actorKeys)

    for (const actor of actors) {
      if (actor.species.length) {
        console.info(`--getting species of -${actor.name}-`);
        actor.species = await requestElement(actor.species, speciesRequested, specieKeys)
      }
    }

    console.info(`-getting starships of -${title}-`);
    const starships = await requestElement(_starships, starshipsRequested, starshipKeys)
 
    console.info(`-checking bigger starship`);
    const biggerStarship = Object.values(starships).reduce((prev, actual) => parseFloat(prev.length) > parseFloat(actual.length) ? prev : actual ,{})


    response.push({
      title,
      planets,
      actors,
      starships,
      biggerStarship
    })
  }

  return response
}

const requestFilms = async () => {
  const data = await requestApi('https://swapi.dev/api/films/')
  return await parseFilmsData(data)
}

const runAPI = async () => await requestFilms();

http.createServer(async (_req, res) => {

  const data = await runAPI()
  // console.info('##FINISHED!##');
  res.setHeader('Connection', 'Transfer-Encoding');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.write(JSON.stringify(data));
  res.end()
  }).listen(3000)

// runAPI();