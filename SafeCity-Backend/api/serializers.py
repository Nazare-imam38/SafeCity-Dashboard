from rest_framework import serializers
from rest_framework_gis.serializers import GeoFeatureModelSerializer
from .models import *

# --------------------------------------------------------
# MyUser Serializer
# --------------------------------------------------------
class MyUserSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.SerializerMethodField(read_only=True)
    supervisor_code = serializers.SerializerMethodField(read_only=True)
    class Meta:
        model = MyUser
        fields = [
            "id",
            "code",
            "full_name",
            "role",
            "is_active",
            "supervisor",
            "supervisor_name",
            "supervisor_code",
            "date_joined",
             "password", "email", "contact"
        ]
        extra_kwargs = {
            "password": {"write_only": True},
        }

    def get_supervisor_name(self, obj):
        return obj.supervisor.full_name if obj.supervisor else None
    def get_supervisor_code(self, obj):
        return obj.supervisor.code if obj.supervisor else None
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = MyUser(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user


class MyUserLoginDashboardSerializer(serializers.ModelSerializer):
    code = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = MyUser
        fields = [
            "id",
            "code",
            "password",
            "full_name",
            "role",
            "is_active",
            
        ]
        extra_kwargs = {
            "password": {"write_only": True}
        }
# --------------------------------------------------------
# Province Administrative Divisions
# --------------------------------------------------------
class ProvinceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Province
        fields = ["id", "province_name"]

# --------------------------------------------------------
# Division Administrative Divisions
# --------------------------------------------------------
class DivisionSerializer(serializers.ModelSerializer):
    province_name = serializers.SerializerMethodField()
    class Meta:
        model = Division
        fields = ["id", "division_name", "province", "province_name"]

    def get_province_name(self, obj):
        return obj.province.province_name

# --------------------------------------------------------
# District Administrative Divisions
# --------------------------------------------------------
class DistrictSerializer(serializers.ModelSerializer):
    province_name = serializers.SerializerMethodField()
    division_name = serializers.SerializerMethodField()
    class Meta:
        model = District
        fields = ["id", "district_name", "division", "province", "province_name", "division_name"]

    def get_province_name(self, obj):
        return obj.province.province_name

    def get_division_name(self, obj):
        return obj.division.division_name

# --------------------------------------------------------
# Tehsil Administrative Divisions
# --------------------------------------------------------
class TehsilSerializer(serializers.ModelSerializer):
    province_name = serializers.SerializerMethodField()
    division_name = serializers.SerializerMethodField()
    district_name = serializers.SerializerMethodField()
    class Meta:
        model = Tehsil
        fields = ["id", "tehsil_name", "district", "division", "province", "province_name", "division_name", "district_name"]
    
    def get_province_name(self, obj):
        return obj.province.province_name

    def get_division_name(self, obj):
        return obj.division.division_name

    def get_district_name(self, obj):
        return obj.district.district_name