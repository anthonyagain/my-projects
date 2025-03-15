from django.views import View
from django.http import HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

import json

from home.models import ContactUs, DevApplication

@method_decorator(ensure_csrf_cookie, name="get")
class ReactHome(View):
    def get(self, request):
        return render(request, 'index.html')

class SubmitApplication(View):
    def post(self, request):
        data = json.loads(request.body)
        DevApplication.objects.create(**data)
        return JsonResponse({"result": "OK"})

class SubmitContactUs(View):
    def post(self, request):
        data = json.loads(request.body)
        ContactUs.objects.create(**data)
        return JsonResponse({"result": "OK"})
