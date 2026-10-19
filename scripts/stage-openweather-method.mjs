import { copyFile, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
export const methodSource = join(repoRoot, 'public', 'openweather-normalization-method.json');
export const methodDestination = join(repoRoot, 'dist', 'public', 'openweather-normalization-method.json');

/** Stage the reviewed alteration method as exact bytes in the Netlify website output. */
export async function stageOpenWeatherMethod(source = methodSource, destination = methodDestination) {
  const sourceStat = await stat(source);
  if (!sourceStat.isFile() || sourceStat.size === 0 || sourceStat.size > 64 * 1024) throw Error('Invalid OpenWeather alteration method file.');
  const original = await readFile(source);
  const method = JSON.parse(original.toString('utf8'));
  if (method?.schemaVersion !== 1 || method?.source?.endpoint !== 'https://api.openweathermap.org/data/2.5/forecast') throw Error('Invalid OpenWeather alteration method identity.');
  await copyFile(source, destination);
  const staged = await readFile(destination);
  if (!original.equals(staged)) throw Error('Staged OpenWeather alteration method differs from the reviewed source.');
  return staged.byteLength;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await stageOpenWeatherMethod();
}
