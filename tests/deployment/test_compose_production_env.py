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
    'NIGHTSKY_WEATHER_PROVIDERS=met',
    'NIGHTSKY_GEOAPIFY_API_KEY=existingprivatevalue',
])
KEY = '12345678901234567890123456789012'


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
