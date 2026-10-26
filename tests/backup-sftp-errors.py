import importlib.util, pathlib, types, unittest

spec=importlib.util.spec_from_file_location('punto_backup_setup',pathlib.Path(__file__).resolve().parents[1]/'deployment'/'prepare-backup.py')
setup=importlib.util.module_from_spec(spec);spec.loader.exec_module(setup)

class KeyReadErrors(unittest.TestCase):
    def result(self,code=1,out='',err=''):
        return types.SimpleNamespace(returncode=code,stdout=out,stderr=err)
    def test_both_sftp_missing_file_formats(self):
        for error in ['File "/home/.ssh/authorized_keys" not found.','stat remote .ssh/authorized_keys: No such file or directory']:
            self.assertTrue(setup.missing_authorized_keys(self.result(err=error)))
    def test_authentication_failure_cannot_be_treated_as_an_empty_key_file(self):
        self.assertFalse(setup.missing_authorized_keys(self.result(code=5,out='get .ssh/authorized_keys old',err='Permission denied, please try again.')))
        self.assertFalse(setup.missing_authorized_keys(self.result(err='Permission denied reading .ssh/authorized_keys: file not found')))
    def test_unrelated_errors_and_success_are_not_missing_keys(self):
        self.assertFalse(setup.missing_authorized_keys(self.result(err='Connection closed')))
        self.assertFalse(setup.missing_authorized_keys(self.result(err='sftp executable not found')))
        self.assertFalse(setup.missing_authorized_keys(self.result(code=0,out='get .ssh/authorized_keys old')))

if __name__=='__main__': unittest.main()
