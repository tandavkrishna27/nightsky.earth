import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'scripts/osm'))
from spot_paths import safe_path
from spot_build import safe_path as build_path
from spot_runner import _safe as runner_path


class SharedPathTests(unittest.TestCase):
    def test_alias_expansion_is_consistent_without_relaxing_traversal(self):
        with tempfile.TemporaryDirectory() as temp:
            actual=Path(temp).resolve()
            alias=actual.parent/'SYNTHA~1'
            original=Path.resolve
            def resolve(value,*args,**kwargs):
                return actual if value==alias else original(value,*args,**kwargs)
            with patch.object(Path,'resolve',autospec=True,side_effect=resolve):
                for wrapper in (safe_path,build_path,runner_path):
                    self.assertEqual(wrapper(alias),actual)
                    with self.assertRaises(ValueError): wrapper(alias/'..'/'escaped')

    @unittest.skipUnless(os.name=='nt','Windows namespaces')
    def test_device_spelling_anchored_relative_and_reserved_aliases_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            for value in ['//?/'+temp.replace(chr(92),'/'), '//./'+temp.replace(chr(92),'/'), 'C:foo', chr(92)+'foo', str(Path(temp)/'COM¹'), str(Path(temp)/'CON .txt')]:
                with self.subTest(value=value):
                    with self.assertRaises(ValueError):safe_path(value)

    @unittest.skipUnless(os.name=='nt','Windows directory junction')
    def test_dangling_junction_and_missing_descendant_refused(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp).resolve();target=root/'target';link=root/'junction'
            target.mkdir()
            result=subprocess.run(['cmd','/c','mklink','/J',str(link),str(target)],capture_output=True,creationflags=0x08000000)
            if result.returncode!=0:self.skipTest('junction creation unavailable')
            try:
                target.rmdir() # Empty, explicitly named fixture target only.
                for value in (link,link/'missing'):
                    with self.assertRaises(ValueError):safe_path(value)
            finally:
                if link.is_junction():link.rmdir() # Removes only the fixture junction.


if __name__=='__main__':unittest.main()
