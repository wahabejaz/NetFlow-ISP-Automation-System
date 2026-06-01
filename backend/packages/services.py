from .models import Package, PackageFeature

class PackageService:
    @staticmethod
    def create_package(data):
        features_input = data.pop('features_input', '')
        package = Package.objects.create(**data)
        if features_input:
            features = [f.strip() for f in features_input.split(',')]
            for f in features:
                if f:
                    PackageFeature.objects.create(package=package, feature_name=f)
        return package
