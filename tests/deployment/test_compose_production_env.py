import importlib.util
import pathlib
import unittest


SCRIPT = pathlib.Path(__file__).resolve().parents[2] / 'scripts/deployment/compose-production-env.py'
SPEC = importlib.util.spec_from_file_location('compose_production_env', SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)

BASE = '\n'.join([
    'NODE_ENV=production',
    'NIGHTSKY_QUOTA_STATE_PATH=/state/provider-quota.json',
    'NIGHTSKY_PLANNING_CARD_ENABLED=false',
    'NIGHTSKY_WEATHER_PROVIDERS=met',
    'NIGHTSKY_GEOAPIFY_API_KEY=existingprivatevalue',
])
KEY = '12345678901234567890123456789012'
OPENWEATHER_KEY = 'SyntheticNotARealCredentialValue'


class ComposeProductionEnvTests(unittest.TestCase):
    def test_preserves_existing_secrets_and_adds_weatherapi(self):
        result = MODULE.compose(BASE, KEY)
        self.assertIn('NIGHTSKY_GEOAPIFY_API_KEY=existingprivatevalue', result)
        self.assertIn('NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi', result)
        self.assertIn('NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi', result)
        self.assertIn(f'NIGHTSKY_WEATHERAPI_KEY={KEY}', result)
        self.assertEqual(result.count('NIGHTSKY_WEATHER_PROVIDERS='), 1)

    def test_no_new_secret_preserves_profile(self):
        self.assertEqual(MODULE.compose(BASE + '\n', ''), BASE)

    def test_adds_openweather_after_existing_weatherapi_without_losing_base(self):
        result = MODULE.compose(BASE, KEY, OPENWEATHER_KEY, True)
        self.assertIn('NIGHTSKY_GEOAPIFY_API_KEY=existingprivatevalue', result)
        self.assertIn('NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi,openweather', result)
        self.assertIn('NIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi,openweather', result)
        self.assertIn(f'NIGHTSKY_WEATHERAPI_KEY={KEY}', result)
        self.assertIn(f'NIGHTSKY_OPENWEATHER_KEY={OPENWEATHER_KEY}', result)
        self.assertIn('NIGHTSKY_PLANNING_CARD_ENABLED=true', result)
        self.assertEqual(result.count('NIGHTSKY_PLANNING_CARD_ENABLED='), 1)
        self.assertEqual(result.count('NIGHTSKY_OPENWEATHER_KEY='), 1)

    def test_refuses_openweather_without_weatherapi_or_with_base_duplicate(self):
        with self.assertRaises(ValueError):
            MODULE.compose(BASE, '', OPENWEATHER_KEY, True)
        with self.assertRaises(ValueError):
            MODULE.compose(BASE + f'\nNIGHTSKY_OPENWEATHER_KEY={OPENWEATHER_KEY}', KEY, OPENWEATHER_KEY, True)

    def test_refuses_invalid_openweather_key(self):
        with self.assertRaises(ValueError):
            MODULE.compose(BASE, KEY, 'key with spaces', True)

    def test_key_presence_without_admission_keeps_openweather_off(self):
        result = MODULE.compose(BASE, KEY, OPENWEATHER_KEY)
        self.assertIn('NIGHTSKY_WEATHER_PROVIDERS=met,weatherapi', result)
        self.assertNotIn('NIGHTSKY_OPENWEATHER_KEY=', result)
        self.assertIn('NIGHTSKY_PLANNING_CARD_ENABLED=false', result)

    def test_admission_without_key_fails_closed(self):
        with self.assertRaises(ValueError):
            MODULE.compose(BASE, KEY, '', True)

    def test_refuses_missing_ledger(self):
        with self.assertRaises(ValueError):
            MODULE.compose(BASE.replace('NIGHTSKY_QUOTA_STATE_PATH=/state/provider-quota.json\n', ''), KEY)

    def test_refuses_duplicate_key_or_existing_admission(self):
        for addition in (
            f'\nNIGHTSKY_WEATHERAPI_KEY={KEY}',
            '\nNIGHTSKY_WEATHER_ADMITTED_PROVIDERS=weatherapi',
        ):
            with self.subTest(addition=addition), self.assertRaises(ValueError):
                MODULE.compose(BASE + addition, KEY)

    def test_refuses_invalid_key(self):
        with self.assertRaises(ValueError):
            MODULE.compose(BASE, 'key with spaces')


if __name__ == '__main__':
    unittest.main()
