"""Security checks for private configuration replacement; synthetic data only."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("client_import", Path(__file__).parents[1] / "deployment/import-google-client.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PrivateImportTests(unittest.TestCase):
    def payload(self):
        return {"web": {"project_id": "caf-punto-cittadino-ai", "client_id": "167971566129-synthetic.apps.googleusercontent.com", "client_secret": "synthetic_test_value_only", "redirect_uris": [module.REDIRECT], "javascript_origins": [module.ORIGIN]}}

    def test_rejects_wrong_project_redirect_and_env_injection(self):
        for key, value in [("project_id", "other-project"), ("redirect_uris", ["https://example.invalid/callback"]), ("client_secret", "synthetic_test_value\nCAF_PRIVATE_ENABLED=true")]:
            with self.subTest(key=key):
                data = self.payload()
                data["web"][key] = value
                with self.assertRaises(ValueError):
                    module.client_values(json.dumps(data))

    def test_preserves_vault_and_login_clears_incompatible_token(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "runtime.env"
            destination.write_text("CAF_VAULT_KEY=synthetic-vault\nGESTIONALE_GOOGLE_CLIENT_ID=keep-login\nGOOGLE_REFRESH_TOKEN=old-token\nCAF_PRIVATE_ENABLED=false\n")
            destination.chmod(0o600)
            module.update_environment(destination, module.client_values(json.dumps(self.payload())))
            text = destination.read_text()
            self.assertIn("CAF_VAULT_KEY=synthetic-vault\n", text)
            self.assertIn("GESTIONALE_GOOGLE_CLIENT_ID=keep-login\n", text)
            self.assertIn("CAF_PRIVATE_ENABLED=false\n", text)
            self.assertIn("GOOGLE_REFRESH_TOKEN=\n", text)
            self.assertNotIn("old-token", text)
            self.assertEqual(destination.stat().st_mode & 0o777, 0o600)

    def test_refuses_symlink_and_duplicate_keys_without_modifying_file(self):
        with tempfile.TemporaryDirectory() as directory:
            destination = Path(directory) / "runtime.env"
            original = "GOOGLE_CLIENT_ID=one\nGOOGLE_CLIENT_ID=two\n"
            destination.write_text(original)
            destination.chmod(0o600)
            with self.assertRaises(ValueError):
                module.update_environment(destination, module.client_values(json.dumps(self.payload())))
            self.assertEqual(destination.read_text(), original)
            link = Path(directory) / "link.env"
            link.symlink_to(destination)
            with self.assertRaises(OSError):
                module.update_environment(link, module.client_values(json.dumps(self.payload())))
            self.assertEqual(destination.read_text(), original)


if __name__ == "__main__":
    unittest.main()
